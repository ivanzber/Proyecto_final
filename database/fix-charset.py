#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix charset for 'Canchas de Fútbol' POI"""

import subprocess
import sys

# Use mysql with utf8mb4 and set the proper title
sql = """SET NAMES utf8mb4;
UPDATE points_of_interest 
SET title = 'Canchas de Fútbol',
    description = 'Cancha principal de fútbol del campus. Escenario de los torneos interfacultades y actividades deportivas estudiantiles.'
WHERE id = 6;
SELECT id, title, description FROM points_of_interest WHERE id = 6;
"""

mysql_path = r"C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe"

proc = subprocess.run(
    [mysql_path, "-u", "root", "-p8311003", "--default-character-set=utf8mb4", "campus_virtual"],
    input=sql.encode("utf-8"),
    capture_output=True
)

print("STDOUT:", proc.stdout.decode("utf-8", errors="replace"))
print("STDERR:", proc.stderr.decode("utf-8", errors="replace"))
print("Return code:", proc.returncode)
