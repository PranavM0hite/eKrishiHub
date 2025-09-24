import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWeather } from '../features/weather/weatherSlice'

const WeatherWidget = () => {
  const dispatch = useDispatch()
  const [city, setCity] = useState('Pune') // default
  const { data, loading, error } = useSelector((state) => state.weather)

  // Fetch default city once on mount
  useEffect(() => {
    dispatch(fetchWeather('Pune'))
  }, [dispatch])

  const handleSearch = () => {
    const q = city.trim()
    if (!q) return
    dispatch(fetchWeather(q))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const errText =
    typeof error === 'string'
      ? error
      : error?.message

  { loading && <p className="text-blue-500">Loading...</p> }
  {
    !loading && errText && !data && (   // <-- don't show error if we have data
      <p className="text-red-600">Error: {errText}</p>
    )
  }

  {
    !loading && data && (
      <div className="text-gray-700 space-y-1">
        <p><strong>City:</strong> {data?.name ?? '—'}</p>
        <p><strong>Temperature:</strong> {data?.main?.temp ?? '—'} °C</p>
        <p><strong>Humidity:</strong> {data?.main?.humidity ?? '—'}%</p>
        <p><strong>Weather:</strong> {data?.weather?.[0]?.main ?? '—'}</p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 p-4 rounded shadow-md w-full max-w-sm mx-auto mt-4">
      <h3 className="text-xl font-bold mb-2 text-blue-700">🌤 Weather Forecast</h3>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Enter city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !city.trim()}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {loading && <p className="text-blue-500">Loading...</p>}
      {!loading && errText && (
        <p className="text-red-500">Error: {errText}</p>
      )}

      {!loading && !errText && data && (
        <div className="text-gray-700 space-y-1">
          <p><strong>City:</strong> {data?.name ?? '—'}</p>
          <p><strong>Temperature:</strong> {data?.main?.temp ?? '—'} °C</p>
          <p><strong>Humidity:</strong> {data?.main?.humidity ?? '—'}%</p>
          <p><strong>Weather:</strong> {data?.weather?.[0]?.main ?? '—'}</p>
        </div>
      )}
    </div>
  )
}

export default WeatherWidget
