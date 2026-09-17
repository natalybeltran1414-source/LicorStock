from decimal import Decimal
from rest_framework import serializers

from .models import Venta, DetalleVenta, PagoVenta
from clientes.models import Cliente
from inventario.models import Producto


class PagoVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoVenta
        fields = ['id', 'metodo', 'monto']


class DetalleVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleVenta
        fields = ['id', 'producto', 'nombre_producto', 'cantidad',
                  'precio_unitario', 'subtotal']


class VentaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    pagos = PagoVentaSerializer(many=True, read_only=True)
    pagado = serializers.SerializerMethodField()
    saldo = serializers.SerializerMethodField()

    class Meta:
        model = Venta
        fields = ['id', 'numero', 'cliente', 'cliente_nombre', 'usuario_nombre',
                  'subtotal', 'total', 'estado', 'fecha', 'detalles', 'pagos',
                  'pagado', 'saldo']

    def get_pagado(self, obj):
        return sum(p.monto for p in obj.pagos.all())

    def get_saldo(self, obj):
        return max(obj.total - self.get_pagado(obj), 0)


class ItemVentaSerializer(serializers.Serializer):
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.filter(estado=True))
    cantidad = serializers.IntegerField(min_value=1)


class PagoInputSerializer(serializers.Serializer):
    METODOS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']
    metodo = serializers.ChoiceField(choices=METODOS)
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))


class VentaCreateSerializer(serializers.Serializer):
    """Entrada para registrar una venta con items y pagos mixtos."""
    cliente = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.filter(estado=True), required=False, allow_null=True)
    items = ItemVentaSerializer(many=True)
    pagos = PagoInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('Agrega al menos un producto a la venta.')
        ids = [i['producto'].id for i in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError('Hay productos duplicados; consolida las cantidades.')
        return value

    def validate(self, attrs):
        total = sum(i['producto'].precio_venta * i['cantidad'] for i in attrs['items'])
        pagado = sum(p['monto'] for p in attrs.get('pagos') or [])
        if pagado > total:
            raise serializers.ValidationError(
                {'pagos': f'Los pagos (${pagado}) exceden el total de la venta (${total}).'})
        resto = total - pagado
        if resto > 0.009 and not attrs.get('cliente'):
            raise serializers.ValidationError(
                {'cliente': 'La venta a crédito requiere un cliente identificado.'})
        attrs['_total'] = total
        attrs['_resto'] = resto
        return attrs
