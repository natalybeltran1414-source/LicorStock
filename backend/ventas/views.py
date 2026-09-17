from datetime import timedelta, datetime, time

from django.db import transaction
from django.db.models import Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from inventario.models import Inventario, MovimientoInventario
from cuentas_por_cobrar.models import Deuda
from cuentas_por_cobrar.serializers import DeudaSerializer

from .models import Venta, DetalleVenta, PagoVenta
from .serializers import VentaSerializer, VentaCreateSerializer


class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.select_related('cliente', 'usuario').prefetch_related(
        'detalles', 'pagos')
    serializer_class = VentaSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return VentaCreateSerializer
        return VentaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        search = params.get('search')
        cliente = params.get('cliente')
        estado = params.get('estado')
        if search:
            qs = qs.filter(numero__icontains=search)
        if cliente:
            qs = qs.filter(cliente_id=cliente)
        if estado:
            qs = qs.filter(estado=estado.upper())
        return qs

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = VentaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data

        # Bloquea el stock de los productos involucrados durante la venta.
        productos = {}
        for item in datos['items']:
            producto = item['producto']
            inventario = Inventario.objects.select_for_update().filter(
                producto_id=producto.id).first()
            disponible = inventario.stock_actual if inventario else 0
            pendiente = productos.get(producto.id, {}).get('cantidad', 0)
            if item['cantidad'] + pendiente > disponible:
                return Response(
                    {'items': f'Stock insuficiente de {producto.nombre}. Disponible: {disponible}.'},
                    status=status.HTTP_400_BAD_REQUEST)
            acumulado = productos.setdefault(
                producto.id, {'producto': producto, 'cantidad': 0})
            acumulado['cantidad'] += item['cantidad']

        total = datos['_total']
        venta = Venta.objects.create(
            numero='TEMP',
            cliente=datos.get('cliente'),
            usuario=request.user,
            subtotal=total,
            total=total,
        )
        venta.numero = f'FV-{venta.id:06d}'
        venta.save(update_fields=['numero'])

        for info in productos.values():
            DetalleVenta.objects.create(
                venta=venta,
                producto=info['producto'],
                nombre_producto=info['producto'].nombre,
                cantidad=info['cantidad'],
                precio_unitario=info['producto'].precio_venta,
                subtotal=info['producto'].precio_venta * info['cantidad'],
            )
            inventario = Inventario.objects.get(producto_id=info['producto'].id)
            inventario.stock_actual -= info['cantidad']
            inventario.save(update_fields=['stock_actual', 'fecha_actualizacion'])
            MovimientoInventario.objects.create(
                producto=info['producto'],
                usuario=request.user,
                tipo_movimiento='SALIDA',
                cantidad=info['cantidad'],
                motivo=f'Venta {venta.numero}',
            )

        for pago in datos['pagos']:
            PagoVenta.objects.create(venta=venta, **pago)

        resto = datos['_resto']
        deuda_creada = None
        if resto > 0.009:
            deuda_creada = Deuda.objects.create(
                cliente=datos['cliente'],
                venta=venta,
                monto_original=resto,
                saldo_pendiente=resto,
            )

        salida = VentaSerializer(venta).data
        salida['deuda'] = DeudaSerializer(deuda_creada).data if deuda_creada else None
        return Response(salida, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def anular(self, request, pk=None):
        """Anula la venta: restaura stock y cancela la deuda si no tiene abonos."""
        venta = self.get_object()
        if venta.estado != 'COMPLETADA':
            return Response({'detail': 'La venta ya está anulada.'},
                            status=status.HTTP_400_BAD_REQUEST)

        deuda = getattr(venta, 'deuda', None)
        if deuda and deuda.abonos.exists():
            return Response(
                {'detail': 'No se puede anular: la deuda asociada ya recibió abonos.'},
                status=status.HTTP_400_BAD_REQUEST)

        for detalle in venta.detalles.all():
            if detalle.producto is None:
                continue
            inventario = Inventario.objects.select_for_update().filter(
                producto_id=detalle.producto_id).first()
            if inventario is None:
                inventario = Inventario.objects.create(producto=detalle.producto)
            inventario.stock_actual += detalle.cantidad
            inventario.save(update_fields=['stock_actual', 'fecha_actualizacion'])
            MovimientoInventario.objects.create(
                producto=detalle.producto,
                usuario=request.user,
                tipo_movimiento='ENTRADA',
                cantidad=detalle.cantidad,
                motivo=f'Anulación de venta {venta.numero}',
            )

        if deuda:
            deuda.estado = 'ANULADA'
            deuda.saldo_pendiente = 0
            deuda.save(update_fields=['estado', 'saldo_pendiente'])

        venta.estado = 'ANULADA'
        venta.save(update_fields=['estado'])
        return Response(VentaSerializer(venta).data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Totales del día para el panel."""
        hoy = timezone.localdate()
        inicio = timezone.make_aware(datetime.combine(hoy, time.min))
        fin = inicio + timedelta(days=1)
        qs = self.get_queryset().filter(estado='COMPLETADA',
                                        fecha__gte=inicio, fecha__lt=fin)
        agg = qs.aggregate(
            cantidad=Count('id'),
            total=Coalesce(Sum('total'), Value(0), output_field=DecimalField(max_digits=12, decimal_places=2)),
        )
        return Response({
            'ventas_hoy': agg['cantidad'],
            'total_hoy': agg['total'],
        })

    @action(detail=False, methods=['get'])
    def semanal(self, request):
        """Totales de ventas por día para los últimos 7 días."""
        hoy = timezone.localdate()
        desde = hoy - timedelta(days=6)
        inicio = timezone.make_aware(datetime.combine(desde, time.min))
        fin = inicio + timedelta(days=7)

        # Agrupación en Python: evita depender de las tablas de zona horaria de MySQL
        filas = self.get_queryset().filter(
            estado='COMPLETADA', fecha__gte=inicio, fecha__lt=fin,
        ).values_list('fecha', 'total')
        datos = {}
        for fecha, total in filas:
            dia = timezone.localdate(fecha)
            acc = datos.setdefault(dia, {'total': 0.0, 'cantidad': 0})
            acc['total'] += float(total or 0)
            acc['cantidad'] += 1

        nombres = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        resultado = []
        for i in range(7):
            dia = desde + timedelta(days=i)
            acc = datos.get(dia, {})
            resultado.append({
                'fecha': dia.isoformat(),
                'nombre': nombres[dia.weekday()],
                'total': round(acc.get('total', 0.0), 2),
                'cantidad': acc.get('cantidad', 0),
            })
        return Response(resultado)

    @action(detail=False, methods=['get'])
    def top_productos(self, request):
        """Productos más vendidos (por unidades) en los últimos N días."""
        try:
            dias = max(1, int(request.query_params.get('dias', 30)))
        except (TypeError, ValueError):
            dias = 30
        desde = timezone.now() - timedelta(days=dias)
        filas = DetalleVenta.objects.filter(
            venta__estado='COMPLETADA',
            venta__fecha__gte=desde,
        ).values('nombre_producto').annotate(
            unidades=Sum('cantidad'),
            ingresos=Coalesce(Sum('subtotal'), Value(0),
                              output_field=DecimalField(max_digits=12, decimal_places=2)),
        ).order_by('-unidades')[:10]
        return Response(list(filas))
