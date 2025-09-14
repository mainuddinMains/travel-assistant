import os
from pathlib import Path
import argparse
import csv
from dotenv import load_dotenv
import googlemaps

# Load .env variables from this file's directory
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

# Access the API key from the .env file
api_key = os.getenv("GOOGLE_MAPS_API_KEY")

if not api_key:
    raise RuntimeError(
        "GOOGLE_MAPS_API_KEY is not set. Add it to docs/.env or your environment."
    )

# Initialize Google Maps client
gmaps = googlemaps.Client(key=api_key)

def pretty_print_minutes(places, durations_seconds):
    mins = [[round(v / 60) for v in row] for row in durations_seconds]
    header = [""] + [p[:18].ljust(18) for p in places]
    print(" ".ljust(20), *header[1:])
    for name, row in zip(places, mins):
        print(name[:18].ljust(20), *[str(v).ljust(18) for v in row])


def write_csv_minutes(path, places, durations_seconds):
    mins = [[round(v / 60) for v in row] for row in durations_seconds]
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([""] + places)
        for name, row in zip(places, mins):
            writer.writerow([name] + row)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", dest="csv_path", help="Write minutes matrix to CSV at PATH")
    parser.add_argument(
        "--mode",
        choices=["driving", "walking", "bicycling", "transit"],
        default="driving",
        help="Travel mode for Google Distance Matrix",
    )
    args = parser.parse_args()

    places = [
        "Statue of Liberty",
        "Times Square",
        "Central Park",
        "Empire State",
        "Brooklyn Bridge",
    ]

    matrix = gmaps.distance_matrix(places, places, mode=args.mode)
    distance_seconds = [
        [row["duration"]["value"] for row in r["elements"]]
        for r in matrix["rows"]
    ]

    pretty_print_minutes(places, distance_seconds)
    if args.csv_path:
        write_csv_minutes(args.csv_path, places, distance_seconds)
