from decimal import Decimal
from rest_framework import serializers

from .models import Deuda, Abono


class AbonoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = Abono
        fields = ['id', 'deuda', 'metodo', 'monto', 'usuario_nombre', 'fecha']


class DeudaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    cliente_telefono = serializers.CharField(source='cliente.telefono', read_only=True)
    venta_numero = serializers.CharField(source='venta.numero', read_only=True)
    venta_total = serializers.DecimalField(source='venta.total', max_digits=12,
                                           decimal_places=2, read_only=True)
    abonos = AbonoSerializer(many=True, read_only=True)

    class Meta:
        model = Deuda
        fields = ['id', 'cliente', 'cliente_nombre', 'cliente_telefono', 'venta',
                  'venta_numero', 'venta_total', 'monto_original', 'saldo_pendiente',
                  'estado', 'fecha_inicio', 'fecha_vencimiento', 'abonos']


class AbonoInputSerializer(serializers.Serializer):
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    metodo = serializers.ChoiceField(choices=['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'],
                                     default='EFECTIVO')
