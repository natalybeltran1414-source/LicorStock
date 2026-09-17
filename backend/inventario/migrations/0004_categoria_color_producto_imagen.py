from django.db import migrations, models

PALETA = [
    '#C9A227',  # dorado
    '#8B1E3F',  # vino
    '#3B8C4E',  # verde botella
    '#D97706',  # ámbar
    '#2563EB',  # azul
    '#7C3AED',  # morado
    '#0E9AA7',  # turquesa
    '#DB2777',  # fucsia
    '#EA580C',  # naranja
    '#64748B',  # gris pizarra
]


def asignar_colores(apps, schema_editor):
    Categoria = apps.get_model('inventario', 'Categoria')
    for idx, cat in enumerate(Categoria.objects.all().order_by('id')):
        cat.color = PALETA[idx % len(PALETA)]
        cat.save(update_fields=['color'])


def revertir_colores(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0003_producto_unidad'),
    ]

    operations = [
        migrations.AddField(
            model_name='categoria',
            name='color',
            field=models.CharField(default='#C9A227', max_length=9),
        ),
        migrations.AddField(
            model_name='producto',
            name='imagen',
            field=models.ImageField(blank=True, null=True, upload_to='productos/'),
        ),
        migrations.RunPython(asignar_colores, revertir_colores),
    ]
