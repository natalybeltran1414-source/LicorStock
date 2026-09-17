from rest_framework import serializers

from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    """Lectura: incluye métricas de compras y deuda (cuando existan ventas)."""

    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'tipo_documento', 'documento', 'telefono',
                  'email', 'direccion', 'estado', 'fecha_creacion']


class ClienteWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['nombre', 'tipo_documento', 'documento', 'telefono',
                  'email', 'direccion', 'estado']

    def validate_documento(self, value):
        if not value:
            return value
        qs = Cliente.objects.filter(documento=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Ya existe un cliente con este documento.')
        return value

    def validate(self, attrs):
        tipo = attrs.get('tipo_documento', getattr(self.instance, 'tipo_documento', None))
        documento = attrs.get('documento', getattr(self.instance, 'documento', None))
        if tipo in ('CEDULA', 'RUC') and not documento:
            raise serializers.ValidationError(
                {'documento': 'Ingresa el número de documento.'})
        if documento and not documento.strip().isdigit():
            raise serializers.ValidationError(
                {'documento': 'El documento solo debe contener números.'})
        nombre = attrs.get('nombre')
        if nombre:
            attrs['nombre'] = nombre.strip()
        return attrs
