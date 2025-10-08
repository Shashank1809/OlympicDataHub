import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

// Base URL for the FastAPI backend
const API_URL = 'http://127.0.0.1:8000';

function App() {
    const [stats, setStats] = useState({});
    const [medalTally, setMedalTally] = useState([]);
    const [nationsOverTime, setNationsOverTime] = useState([]);
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('Overall');

    useEffect(() => {
        // Fetch initial data on component mount
        axios.get(`${API_URL}/stats`).then(response => setStats(response.data));
        axios.get(`${API_URL}/nations_over_time`).then(response => setNationsOverTime(response.data));
        axios.get(`${API_URL}/years`).then(response => setYears(response.data));
    }, []);

    useEffect(() => {
        // Fetch medal tally whenever the selectedYear changes
        axios.get(`${API_URL}/medal_tally?year=${selectedYear}`).then(response => {
            setMedalTally(response.data);
        });
    }, [selectedYear]);

    return (
        <div className="App">
            <header className="header">
                <h1>Olympics Insights Hub 🏅</h1>
                <div className="filter-container">
                    <label htmlFor="year-select">Select Year:</label>
                    <select
                        id="year-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </header>

            <main className="dashboard">
                <div className="kpi-grid">
                    <KpiCard title="Editions" value={stats.editions} />
                    <KpiCard title="Hosts" value={stats.hosts} />
                    <KpiCard title="Sports" value={stats.sports} />
                    <KpiCard title="Events" value={stats.events} />
                    <KpiCard title="Nations" value={stats.nations} />
                    <KpiCard title="Athletes" value={stats.athletes} />
                </div>

                <div className="charts-grid">
                    <div className="chart-container">
                        <h2>Global Medal Distribution ({selectedYear})</h2>
                        <MedalMap data={medalTally} />
                    </div>
                    <div className="chart-container">
                        <h2>Participating Nations Over Time</h2>
                        <NationsLineChart data={nationsOverTime} />
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- Reusable Components ---

const KpiCard = ({ title, value }) => (
    <div className="kpi-card">
        <h3>{title}</h3>
        <p>{value || '...'}</p>
    </div>
);

const MedalMap = ({ data }) => (
    <Plot
        data={[{
            type: 'choropleth',
            locations: data.map(item => item.region),
            locationmode: 'country names',
            z: data.map(item => item.total),
            text: data.map(item => `${item.region}<br>Gold: ${item.Gold}<br>Silver: ${item.Silver}<br>Bronze: ${item.Bronze}`),
            colorscale: 'Viridis',
            reversescale: true,
            colorbar: {
                title: 'Total Medals',
            },
        }]}
        layout={{
            geo: {
                projection: { type: 'natural earth' },
            },
            margin: { l: 0, r: 0, t: 0, b: 0 },
        }}
        style={{ width: '100%', height: '450px' }}
        useResizeHandler
    />
);

const NationsLineChart = ({ data }) => (
    <Plot
        data={[{
            x: data.map(item => item.Year),
            y: data.map(item => item.count),
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: 'rgb(26, 118, 255)' },
        }]}
        layout={{
            xaxis: { title: 'Year' },
            yaxis: { title: 'Number of Nations' },
            margin: { l: 50, r: 20, t: 20, b: 40 },
        }}
        style={{ width: '100%', height: '450px' }}
        useResizeHandler
    />
);


export default App;