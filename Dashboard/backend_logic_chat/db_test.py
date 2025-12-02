from sqlmodel import SQLModel, Field, create_engine, Session
import os
from dotenv import load_dotenv

load_dotenv("api.env")

db_name = os.getenv("DB_NAME")
db_password = os.getenv("DB_PASSWORD")

# Define a simple model
class TestUser(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str

# MySQL connection - update these credentials
DATABASE_URL = f"mysql+pymysql://root:{db_password}@localhost/{db_name}"

# Create engine
engine = create_engine(DATABASE_URL, echo=True)  # echo=True shows SQL queries

def main():
    # 1. Create table
    print("Creating tables...")
    SQLModel.metadata.create_all(engine)
    print("✓ Tables created")

    # 2. Insert a row
    print("\nInserting test user...")
    with Session(engine) as session:
        user = TestUser(name="Test User", email="test@example.com")
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"✓ Inserted user with id: {user.id}")

    # 3. Read it back
    print("\nReading from database...")
    with Session(engine) as session:
        users = session.query(TestUser).all()
        for u in users:
            print(f"  - {u.id}: {u.name} ({u.email})")

    print("\n✓ Connection successful!")

if __name__ == "__main__":
    main()
