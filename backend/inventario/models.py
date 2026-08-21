from django.db import models
from usuarios.models import Usuario

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    stock_minimo = models.IntegerField(default=5)
    estado = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class Inventario(models.Model):
    producto = models.OneToOneField(Producto, on_delete=models.CASCADE, related_name='inventario')
    stock_actual = models.IntegerField(default=0)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Inventario de {self.producto.nombre}: {self.stock_actual}"

class MovimientoInventario(models.Model):
    TIPOS = (
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('AJUSTE', 'Ajuste'),
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='movimientos')
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    tipo_movimiento = models.CharField(max_length=20, choices=TIPOS)
    cantidad = models.IntegerField()
    motivo = models.CharField(max_length=255, blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo_movimiento} de {self.cantidad} {self.producto.nombre}"
