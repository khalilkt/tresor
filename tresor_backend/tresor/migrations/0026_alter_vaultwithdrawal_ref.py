# Generated by Django 5.0.4 on 2024-07-10 20:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tresor', '0025_alter_vaultdeposit_ref'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vaultwithdrawal',
            name='ref',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
