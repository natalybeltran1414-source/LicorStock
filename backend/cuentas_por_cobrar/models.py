from django.db import models

class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    cedula = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    correo = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.cedula}"

class Deuda(models.Model):
    venta = models.OneToOneField('ventas.Venta', on_delete=models.CASCADE, related_name='deuda')
    monto_original = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_pendiente = models.DecimalField(max_digits=12, decimal_places=2)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateTimeField(blank=True, null=True)
    estado = models.CharField(max_length=20, default='PENDIENTE') # PENDIENTE, PAGADA

    def __str__(self):
        return f"Deuda Venta {self.venta.id} - Saldo: {self.saldo_pendiente}"

class Abono(models.Model):
    deuda = models.ForeignKey(Deuda, on_delete=models.CASCADE, related_name='abonos')
    tipo_pago = models.ForeignKey('ventas.TipoPago', on_delete=models.SET_NULL, null=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Abono de {self.monto} a Deuda {self.deuda.id}"

