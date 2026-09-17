from django.db import models
from clientes.models import Cliente


class Deuda(models.Model):
    ESTADOS = (
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
        ('ANULADA', 'Anulada'),
    )
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='deudas')
    venta = models.OneToOneField('ventas.Venta', on_delete=models.CASCADE, related_name='deuda')
    monto_original = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_pendiente = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_vencimiento = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"Deuda {self.cliente.nombre} - Saldo: ${self.saldo_pendiente}"


class Abono(models.Model):
    METODOS = (
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('TRANSFERENCIA', 'Transferencia'),
    )
    deuda = models.ForeignKey(Deuda, on_delete=models.CASCADE, related_name='abonos')
    metodo = models.CharField(max_length=20, choices=METODOS, default='EFECTIVO')
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.SET_NULL, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"Abono de ${self.monto} a deuda #{self.deuda_id}"
