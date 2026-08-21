from django.db import models
from usuarios.models import Usuario
from cuentas_por_cobrar.models import Cliente
from inventario.models import Producto

class Venta(models.Model):
    ESTADOS = (
        ('PAGADA', 'Pagada'),
        ('CREDITO', 'Crédito'),
        ('ANULADA', 'Anulada'),
    )
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impuesto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PAGADA')

    def __str__(self):
        return f"Venta {self.id} - {self.total}"

class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"Detalle de {self.producto.nombre} en Venta {self.venta.id}"

class TipoPago(models.Model):
    nombre = models.CharField(max_length=50)
    estado = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class Pago(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='pagos')
    tipo_pago = models.ForeignKey(TipoPago, on_delete=models.SET_NULL, null=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pago de {self.monto} para Venta {self.venta.id}"

class Factura(models.Model):
    venta = models.OneToOneField(Venta, on_delete=models.CASCADE, related_name='factura')
    numero_factura = models.CharField(max_length=50, unique=True)
    fecha_emision = models.DateTimeField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    impuesto = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(max_length=20, default='EMITIDA')

    def __str__(self):
        return f"Factura {self.numero_factura}"
