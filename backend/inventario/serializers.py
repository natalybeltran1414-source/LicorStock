from rest_framework import serializers
from django.db.models import Count

from .models import Categoria, Producto, Inventario, MovimientoInventario


class CategoriaSerializer(serializers.ModelSerializer):
    total_productos = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'color', 'estado', 'total_productos']

    def validate_color(self, value):
        import re
        if not re.fullmatch(r'#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})', value or ''):
            raise serializers.ValidationError('Color inválido. Usa formato hexadecimal (#RRGGBB).')
        return value.upper()

    def get_total_productos(self, obj):
        return getattr(obj, 'total_productos', obj.productos.filter(estado=True).count())

    def validate_nombre(self, value):
        qs = Categoria.objects.filter(nombre__iexact=value.strip())
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Ya existe una categoría con este nombre.')
        return value.strip()


class ProductoSerializer(serializers.ModelSerializer):
    """Lectura: incluye datos denormalizados para las listas."""
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    categoria_color = serializers.CharField(source='categoria.color', read_only=True)
    stock_actual = serializers.IntegerField(source='inventario.stock_actual', read_only=True)

    class Meta:
        model = Producto
        fields = ['id', 'categoria', 'categoria_nombre', 'categoria_color', 'nombre', 'descripcion',
                  'precio_compra', 'precio_venta', 'stock_minimo', 'stock_actual',
                  'unidad', 'imagen', 'estado']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.imagen and request is not None:
            try:
                data['imagen'] = request.build_absolute_uri(instance.imagen.url)
            except ValueError:
                data['imagen'] = None
        return data


class ProductoWriteSerializer(serializers.ModelSerializer):
    stock_inicial = serializers.IntegerField(write_only=True, required=False, min_value=0, default=0)

    class Meta:
        model = Producto
        fields = ['categoria', 'nombre', 'descripcion', 'precio_compra',
                  'precio_venta', 'stock_minimo', 'estado', 'stock_inicial']

    def validate_categoria(self, value):
        if not value.estado:
            raise serializers.ValidationError('La categoría seleccionada está inactiva.')
        return value

    def validate(self, attrs):
        precio_compra = attrs.get('precio_compra', getattr(self.instance, 'precio_compra', 0))
        precio_venta = attrs.get('precio_venta', getattr(self.instance, 'precio_venta', 0))
        if precio_venta <= 0:
            raise serializers.ValidationError({'precio_venta': 'Debe ser mayor a cero.'})
        if precio_venta < precio_compra:
            raise serializers.ValidationError(
                {'precio_venta': 'El precio de venta no puede ser menor al de compra.'})
        return attrs

    def create(self, validated_data):
        stock_inicial = validated_data.pop('stock_inicial', 0)
        producto = Producto.objects.create(**validated_data)
        Inventario.objects.create(producto=producto, stock_actual=stock_inicial)
        if stock_inicial > 0:
            MovimientoInventario.objects.create(
                producto=producto,
                usuario=self.context['request'].user,
                tipo_movimiento='ENTRADA',
                cantidad=stock_inicial,
                motivo='Stock inicial del producto',
            )
        return producto

    def update(self, instance, validated_data):
        validated_data.pop('stock_inicial', None)  # el stock se gestiona vía movimientos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = ['id', 'producto', 'producto_nombre', 'usuario', 'usuario_nombre',
                  'tipo_movimiento', 'cantidad', 'motivo', 'fecha']
        read_only_fields = ['usuario', 'fecha']


class AjusteSerializer(serializers.Serializer):
    """Validación de entrada para el endpoint de ajuste de inventario."""
    TIPOS = ['ENTRADA', 'SALIDA', 'AJUSTE']

    producto = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.filter(estado=True))
    tipo_movimiento = serializers.ChoiceField(choices=TIPOS)
    cantidad = serializers.IntegerField(min_value=0)
    motivo = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate(self, attrs):
        if attrs['tipo_movimiento'] == 'AJUSTE' and 'cantidad' not in attrs:
            raise serializers.ValidationError({'cantidad': 'Indica la cantidad final.'})
        return attrs
