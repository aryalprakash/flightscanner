# Amadeus API - Example Normalized Output

This document shows how raw Amadeus API responses are transformed into clean, UI-friendly data structures.

## Usage

```typescript
import { searchFlights } from "@/api/services";

// Search for flights
const result = await searchFlights({
  originLocationCode: "JFK",
  destinationLocationCode: "LAX",
  departureDate: "2024-06-15",
  returnDate: "2024-06-22",
  adults: 2,
  travelClass: "ECONOMY",
});

console.log(result);
```

---

## Example Normalized Output

```json
{
  "offers": [
    {
      "id": "1",
      "price": {
        "total": 856.42,
        "base": 720.0,
        "currency": "USD",
        "perTraveler": 428.21
      },
      "itineraries": [
        {
          "direction": "outbound",
          "duration": {
            "hours": 5,
            "minutes": 30,
            "totalMinutes": 330,
            "formatted": "5h 30m"
          },
          "segments": [
            {
              "id": "1",
              "departure": {
                "airportCode": "JFK",
                "cityCode": "NYC",
                "countryCode": "US",
                "terminal": "1",
                "dateTime": "2024-06-15T08:00:00",
                "time": "08:00",
                "date": "2024-06-15"
              },
              "arrival": {
                "airportCode": "LAX",
                "cityCode": "LAX",
                "countryCode": "US",
                "terminal": "B",
                "dateTime": "2024-06-15T11:30:00",
                "time": "11:30",
                "date": "2024-06-15"
              },
              "duration": {
                "hours": 5,
                "minutes": 30,
                "totalMinutes": 330,
                "formatted": "5h 30m"
              },
              "flightNumber": "AA100",
              "airline": {
                "code": "AA",
                "name": "American Airlines"
              },
              "aircraft": "Boeing 777-300ER",
              "stops": 0
            }
          ],
          "stops": 0
        },
        {
          "direction": "inbound",
          "duration": {
            "hours": 5,
            "minutes": 15,
            "totalMinutes": 315,
            "formatted": "5h 15m"
          },
          "segments": [
            {
              "id": "2",
              "departure": {
                "airportCode": "LAX",
                "cityCode": "LAX",
                "countryCode": "US",
                "terminal": "B",
                "dateTime": "2024-06-22T14:00:00",
                "time": "14:00",
                "date": "2024-06-22"
              },
              "arrival": {
                "airportCode": "JFK",
                "cityCode": "NYC",
                "countryCode": "US",
                "terminal": "1",
                "dateTime": "2024-06-22T22:15:00",
                "time": "22:15",
                "date": "2024-06-22"
              },
              "duration": {
                "hours": 5,
                "minutes": 15,
                "totalMinutes": 315,
                "formatted": "5h 15m"
              },
              "flightNumber": "AA200",
              "airline": {
                "code": "AA",
                "name": "American Airlines"
              },
              "aircraft": "Boeing 777-300ER",
              "stops": 0
            }
          ],
          "stops": 0
        }
      ],
      "validatingAirline": {
        "code": "AA",
        "name": "American Airlines"
      },
      "bookingClass": "ECONOMY",
      "seatsAvailable": 9,
      "lastTicketingDate": "2024-06-10",
      "isNonStop": true,
      "isOneWay": false
    },
    {
      "id": "2",
      "price": {
        "total": 678.9,
        "base": 560.0,
        "currency": "USD",
        "perTraveler": 339.45
      },
      "itineraries": [
        {
          "direction": "outbound",
          "duration": {
            "hours": 8,
            "minutes": 45,
            "totalMinutes": 525,
            "formatted": "8h 45m"
          },
          "segments": [
            {
              "id": "3",
              "departure": {
                "airportCode": "JFK",
                "cityCode": "NYC",
                "countryCode": "US",
                "terminal": "4",
                "dateTime": "2024-06-15T06:00:00",
                "time": "06:00",
                "date": "2024-06-15"
              },
              "arrival": {
                "airportCode": "DFW",
                "cityCode": "DFW",
                "countryCode": "US",
                "terminal": "D",
                "dateTime": "2024-06-15T09:30:00",
                "time": "09:30",
                "date": "2024-06-15"
              },
              "duration": {
                "hours": 4,
                "minutes": 30,
                "totalMinutes": 270,
                "formatted": "4h 30m"
              },
              "flightNumber": "DL450",
              "airline": {
                "code": "DL",
                "name": "Delta Air Lines"
              },
              "aircraft": "Airbus A321",
              "stops": 0
            },
            {
              "id": "4",
              "departure": {
                "airportCode": "DFW",
                "cityCode": "DFW",
                "countryCode": "US",
                "terminal": "D",
                "dateTime": "2024-06-15T11:00:00",
                "time": "11:00",
                "date": "2024-06-15"
              },
              "arrival": {
                "airportCode": "LAX",
                "cityCode": "LAX",
                "countryCode": "US",
                "terminal": "2",
                "dateTime": "2024-06-15T12:45:00",
                "time": "12:45",
                "date": "2024-06-15"
              },
              "duration": {
                "hours": 2,
                "minutes": 45,
                "totalMinutes": 165,
                "formatted": "2h 45m"
              },
              "flightNumber": "DL550",
              "airline": {
                "code": "DL",
                "name": "Delta Air Lines"
              },
              "aircraft": "Boeing 737-800",
              "stops": 0
            }
          ],
          "stops": 1
        }
      ],
      "validatingAirline": {
        "code": "DL",
        "name": "Delta Air Lines"
      },
      "bookingClass": "ECONOMY",
      "seatsAvailable": 4,
      "lastTicketingDate": "2024-06-12",
      "isNonStop": false,
      "isOneWay": true
    }
  ],
  "meta": {
    "totalCount": 2,
    "searchParams": {
      "origin": "JFK",
      "destination": "LAX",
      "departureDate": "2024-06-15",
      "returnDate": "2024-06-22",
      "passengers": 2
    },
    "searchedAt": "2024-05-20T10:30:00.000Z"
  }
}
```

---

## Key Transformations

| Raw Amadeus Field             | Normalized Field         | Transformation                      |
| ----------------------------- | ------------------------ | ----------------------------------- |
| `price.grandTotal` (string)   | `price.total` (number)   | Parsed to float                     |
| `itineraries[0].duration`     | `duration.formatted`     | `"PT5H30M"` → `"5h 30m"`            |
| `segment.departure.at`        | `departure.time`         | `"2024-06-15T08:00:00"` → `"08:00"` |
| `validatingAirlineCodes[0]`   | `validatingAirline.name` | Code resolved via dictionaries      |
| `itineraries.length > 1`      | `isOneWay`               | Derived boolean                     |
| `segments.length === 1` (all) | `isNonStop`              | Derived boolean                     |
| `travelerPricings.length`     | `price.perTraveler`      | Total ÷ passenger count             |

---

## Environment Variables

Create a `.env.local` file:

```bash
VITE_AMADEUS_BASE_URL=https://test.api.amadeus.com
VITE_AMADEUS_CLIENT_ID=your_client_id_here
VITE_AMADEUS_CLIENT_SECRET=your_client_secret_here
```

> **Note:** Get test credentials at [Amadeus for Developers](https://developers.amadeus.com/)
