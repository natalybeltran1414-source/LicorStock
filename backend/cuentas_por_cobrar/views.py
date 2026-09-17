from django.db import transaction
from django.db.models import Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Deuda, Abono
from .serializers import DeudaSerializer, AbonoInputSerializer


class DeudaViewSet(viewsets.ReadOnlyModelViewSet):
    """Las deudas se generan automáticamente al registrar ventas a crédito."""
    queryset = Deuda.objects.select_related('cliente', 'venta').prefetch_related('abonos')
    serializer_class = DeudaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        estado = params.get('estado')
        cliente = params.get('cliente')
        search = params.get('search')
        if estado:
            qs = qs.filter(estado=estado.upper())
        if cliente:
            qs = qs.filter(cliente_id=cliente)
        if search:
            qs = qs.filter(cliente__nombre__icontains=search) | qs.filter(venta__numero__icontains=search)
        return qs

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def abonar(self, request, pk=None):
        """Registra un abono y actualiza el saldo; cierra la deuda al llegar a cero."""
        deuda = self.get_object()
        if deuda.estado != 'PENDIENTE':
            return Response({'detail': f'La deuda está {deuda.estado.lower()}; no admite abonos.'},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = AbonoInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        monto = serializer.validated_data['monto']
        if monto > deuda.saldo_pendiente:
            return Response(
                {'monto': f'El abono excede el saldo pendiente (${deuda.saldo_pendiente}).'},
                status=status.HTTP_400_BAD_REQUEST)

        Abono.objects.create(
            deuda=deuda,
            metodo=serializer.validated_data['metodo'],
            monto=monto,
            usuario=request.user,
        )
        deuda.saldo_pendiente -= monto
        if deuda.saldo_pendiente <= 0.009:
            deuda.saldo_pendiente = 0
            deuda.estado = 'PAGADA'
        deuda.save(update_fields=['saldo_pendiente', 'estado'])
        return Response(DeudaSerializer(deuda).data)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Total por cobrar para el panel."""
        agg = Deuda.objects.filter(estado='PENDIENTE').aggregate(
            cantidad=Count('id'),
            total=Coalesce(Sum('saldo_pendiente'), Value(0),
                           output_field=DecimalField(max_digits=12, decimal_places=2)),
        )
        return Response({
            'deudas_pendientes': agg['cantidad'],
            'total_por_cobrar': agg['total'],
        })
