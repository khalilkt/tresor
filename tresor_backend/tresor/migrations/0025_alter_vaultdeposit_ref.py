# Generated by Django 5.0.4 on 2024-07-10 18:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tresor', '0024_vaultdeposit_created_by_vaultwithdrawal_created_by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vaultdeposit',
            name='ref',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
