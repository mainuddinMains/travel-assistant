"""
Database Inspector Script
Inspects both auth and dashboard databases to show:
- Database file locations
- All tables and schemas
- Data counts and sample data
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime

def format_size(size_bytes):
    """Format bytes to human readable size."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def inspect_database(db_path: Path, db_name: str):
    """Inspect a SQLite database and print its contents."""
    if not db_path.exists():
        print(f"\n{'='*80}")
        print(f"[X] {db_name} Database NOT FOUND")
        print(f"   Expected location: {db_path}")
        print(f"{'='*80}")
        return
    
    file_size = db_path.stat().st_size
    print(f"\n{'='*80}")
    print(f"[OK] {db_name} Database")
    print(f"{'='*80}")
    print(f"Location: {db_path}")
    print(f"Size: {format_size(file_size)}")
    print(f"Modified: {datetime.fromtimestamp(db_path.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row  # Enable column access by name
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        
        if not tables:
            print(f"\n[!] No tables found in database")
            conn.close()
            return
        
        print(f"\nTables: {len(tables)}")
        print("-" * 80)
        
        for table in tables:
            table_name = table[0]
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            print(f"\nTable: {table_name}")
            print(f"   Rows: {row_count}")
            print(f"   Columns ({len(columns)}):")
            
            for col in columns:
                col_name = col[1]
                col_type = col[2]
                not_null = "NOT NULL" if col[3] else "NULL"
                default = f" DEFAULT {col[4]}" if col[4] else ""
                pk = " PRIMARY KEY" if col[5] else ""
                print(f"      • {col_name} ({col_type}) {not_null}{default}{pk}")
            
            # Get sample data (first 5 rows)
            if row_count > 0:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
                rows = cursor.fetchall()
                
                print(f"\n   Sample Data (showing first {min(5, row_count)} of {row_count} rows):")
                for i, row in enumerate(rows, 1):
                    print(f"      Row {i}:")
                    row_dict = dict(row)
                    # Truncate long values for display
                    for key, value in row_dict.items():
                        if value is None:
                            display_value = "NULL"
                        elif isinstance(value, (str, bytes)):
                            str_value = str(value)
                            if len(str_value) > 100:
                                display_value = str_value[:97] + "..."
                            else:
                                display_value = str_value
                        elif isinstance(value, (dict, list)):
                            json_value = json.dumps(value)
                            if len(json_value) > 100:
                                display_value = json_value[:97] + "..."
                            else:
                                display_value = json_value
                        else:
                            display_value = str(value)
                        print(f"         {key}: {display_value}")
        
        # Get database statistics
        print(f"\nDatabase Statistics:")
        print("-" * 80)
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            print(f"   {table_name}: {row_count} rows")
        
        conn.close()
        
    except Exception as e:
        print(f"[ERROR] Error inspecting database: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main function to inspect all databases."""
    import sys
    # Fix Windows console encoding
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    print("\n" + "="*80)
    print("DATABASE INSPECTOR - Travel Assistant")
    print("="*80)
    
    # Get project root
    project_root = Path(__file__).parent
    
    # Auth Backend Database (in auth-backend directory)
    auth_db_path = project_root / "backend" / "auth-backend" / "travel_assistant.db"
    inspect_database(auth_db_path, "Auth Backend")
    
    # Dashboard Backend Database (in project root)
    dashboard_db_path = project_root / "travel_assistant.db"
    inspect_database(dashboard_db_path, "Dashboard Backend")
    
    # Also check if there's a db in the auth-backend subdirectory
    auth_db_path2 = project_root / "travel_assistant.db"
    if auth_db_path2.exists() and auth_db_path2 != dashboard_db_path:
        inspect_database(auth_db_path2, "Alternative Auth Backend Location")
    
    print(f"\n{'='*80}")
    print("[OK] Database inspection complete!")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()

