from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

# Initialize the FastAPI app
app = FastAPI()

# --- CORS Middleware ---
# This allows the React frontend (running on a different port) to communicate with this backend.
origins = [
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Loading and Preprocessing ---
# Load and preprocess data on startup to avoid reloading for each API call.
def load_data():
    df = pd.read_csv('athlete_events.csv')
    region_df = pd.read_csv('noc_regions.csv')

    # Filter for Summer Olympics
    df = df[df['Season'] == 'Summer']
    # Merge with region data
    df = df.merge(region_df, on='NOC', how='left')
    # Drop duplicates
    df.drop_duplicates(inplace=True)
    # One-hot encode medals
    df = pd.concat([df, pd.get_dummies(df['Medal'])], axis=1)
    return df

olympics_df = load_data()


# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Olympics Analysis API"}

@app.get("/stats")
def get_top_stats():
    """Returns top-level statistics for the dashboard KPIs."""
    editions = olympics_df['Year'].unique().shape[0] - 1
    cities = olympics_df['City'].unique().shape[0]
    sports = olympics_df['Sport'].unique().shape[0]
    events = olympics_df['Event'].unique().shape[0]
    athletes = olympics_df['Name'].unique().shape[0]
    nations = olympics_df['region'].unique().shape[0]
    return {
        "editions": editions,
        "hosts": cities,
        "sports": sports,
        "events": events,
        "athletes": athletes,
        "nations": nations
    }

@app.get("/medal_tally")
def get_medal_tally(year: str = 'Overall'):
    """Returns the medal tally, filterable by year."""
    # Drop duplicates to count medals once per team event
    medal_df = olympics_df.drop_duplicates(subset=['Team', 'NOC', 'Games', 'Year', 'City', 'Sport', 'Event', 'Medal'])

    if year == 'Overall':
        temp_df = medal_df
    else:
        temp_df = medal_df[medal_df['Year'] == int(year)]

    # Group by region and sum medals
    tally = temp_df.groupby('region').sum()[['Gold', 'Silver', 'Bronze']].sort_values('Gold', ascending=False).reset_index()
    tally['total'] = tally['Gold'] + tally['Silver'] + tally['Bronze']

    # Convert to dictionary for JSON response
    return tally.to_dict('records')

@app.get("/nations_over_time")
def get_nations_over_time():
    """Returns data for the 'Participating Nations Over Time' line chart."""
    nations_over_time = olympics_df.drop_duplicates(['Year', 'region'])['Year'].value_counts().reset_index()
    nations_over_time.rename(columns={'index': 'Year', 'Year': 'count'}, inplace=True)
    nations_over_time.sort_values('Year', inplace=True)
    return nations_over_time.to_dict('records')

@app.get("/years")
def get_years():
    """Returns a list of unique years for the filter dropdown."""
    years = olympics_df['Year'].unique().tolist()
    years.sort()
    years.insert(0, 'Overall')
    return years