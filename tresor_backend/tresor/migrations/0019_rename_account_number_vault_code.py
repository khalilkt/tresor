# Generated by Django 5.0.4 on 2024-07-07 11:58

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tresor', '0018_vault_account_number'),
    ]

    operations = [
        migrations.RenameField(
            model_name='vault',
            old_name='account_number',
            new_name='code',
        ),
    ]
