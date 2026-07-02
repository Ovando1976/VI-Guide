import React, { useState, useMemo } from 'react';
import { calculateTariffQuote } from '../lib/mobility/tariffEngine';
import { type IslandCode, type ServiceClass, type TripType } from '../types';
import { Calculator, Users, Briefcase, Ship, Car } from 'lucide-react';

interface TariffCalculatorProps {
  island: IslandCode;
}

export const TariffCalculator: React.FC<TariffCalculatorProps> = ({ island }) => {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    passengers: 1,
    luggage: 0,
    tripType: 'standard' as TripType,
    serviceClass: 'shared' as ServiceClass,
  });

  const quote = useMemo(() => {
    if (!form.origin || !form.destination) return null;
    return calculateTariffQuote({
      island,
      originLabel: form.origin,
      destinationLabel: form.destination,
      tripType: form.tripType,
      serviceClass: form.serviceClass,
      passengers: form.passengers,
      luggage: form.luggage,
    });
  }, [form, island]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
      <div className="mb-6 flex items-center gap-2">
        <Calculator className="text-emerald-500" />
        <h2 className="text-xl font-bold text-white">Tariff Estimator</h2>
      </div>

      <div className="space-y-4">
        {/* Origin / Destination */}
        <input 
          className="w-full rounded-lg bg-slate-800 p-3 text-white placeholder-slate-500 border border-slate-700 focus:border-emerald-500 outline-none"
          placeholder="Origin (e.g. Cyril E. King)"
          value={form.origin}
          onChange={(e) => setForm(f => ({ ...f, origin: e.target.value }))}
        />
        <input 
          className="w-full rounded-lg bg-slate-800 p-3 text-white placeholder-slate-500 border border-slate-700 focus:border-emerald-500 outline-none"
          placeholder="Destination (e.g. Charlotte Amalie)"
          value={form.destination}
          onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))}
        />

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 flex items-center gap-1"><Users size={12}/> Pax</label>
            <input type="number" min="1" className="bg-slate-800 rounded p-2" value={form.passengers} onChange={(e) => setForm(f => ({ ...f, passengers: parseInt(e.target.value) }))}/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 flex items-center gap-1"><Briefcase size={12}/> Luggage</label>
            <input type="number" min="0" className="bg-slate-800 rounded p-2" value={form.luggage} onChange={(e) => setForm(f => ({ ...f, luggage: parseInt(e.target.value) }))}/>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {quote && (
        <div className="mt-6 rounded-xl bg-emerald-900/20 border border-emerald-500/30 p-4">
          <div className="flex justify-between items-end">
            <span className="text-slate-300">Total Fare</span>
            <span className="text-3xl font-bold text-emerald-400">${quote.total}</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 space-y-1">
            {quote.notes.map((note, i) => (
              <p key={i}>• {note}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
