import React, { useState } from 'react';
import { TariffCalculator } from './TariffCalculator';
import { IslandCode, ServiceClass, TripType } from '../types';
import { ChevronRight, ChevronLeft, Send, MapPin, Users } from 'lucide-react';

export const BookingFlow = ({ island }: { island: IslandCode }) => {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    origin: '',
    destination: '',
    passengers: 1,
    luggage: 0,
    tripType: 'standard' as TripType,
    serviceClass: 'shared' as ServiceClass,
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Progress Indicator */}
      <div className="mb-8 flex justify-between items-center">
        {['Details', 'Logistics', 'Dispatch'].map((s, i) => (
          <div key={s} className={`flex items-center ${step >= i + 1 ? 'text-emerald-400' : 'text-slate-600'}`}>
            <span className="h-8 w-8 rounded-full border border-current flex items-center justify-center mr-2">{i + 1}</span>
            <span className="text-sm font-medium">{s}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Location */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <h2 className="text-2xl font-bold text-white">Where to?</h2>
          <input 
            className="w-full bg-slate-800 p-4 rounded-lg border border-slate-700"
            placeholder="Pickup Location"
            value={bookingData.origin}
            onChange={(e) => setBookingData(d => ({...d, origin: e.target.value}))}
          />
          <input 
            className="w-full bg-slate-800 p-4 rounded-lg border border-slate-700"
            placeholder="Destination"
            value={bookingData.destination}
            onChange={(e) => setBookingData(d => ({...d, destination: e.target.value}))}
          />
        </div>
      )}

      {/* Step 2: Logistics */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h2 className="text-2xl font-bold text-white">Travel Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Passengers</label>
              <input type="number" className="w-full bg-slate-800 p-3 rounded" value={bookingData.passengers} onChange={(e) => setBookingData(d => ({...d, passengers: parseInt(e.target.value)}))}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Luggage</label>
              <input type="number" className="w-full bg-slate-800 p-3 rounded" value={bookingData.luggage} onChange={(e) => setBookingData(d => ({...d, luggage: parseInt(e.target.value)}))}/>
            </div>
          </div>
          {/* Trip Type Selectors */}
          <div className="flex gap-2">
            {(['standard', 'cruise'] as TripType[]).map(t => (
              <button key={t} onClick={() => setBookingData(d => ({...d, tripType: t}))} className={`p-3 rounded capitalize ${bookingData.tripType === t ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Final Review & Dispatch */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h2 className="text-2xl font-bold text-white">Review & Dispatch</h2>
          {/* Reuse your existing TariffCalculator as the final step */}
          <TariffCalculator island={island} /> 
          
          <button 
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 rounded-xl transition-all"
            onClick={() => alert("Dispatch Request Sent to VITC Node")}
          >
            <Send size={20} /> Request Dispatch
          </button>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="mt-8 flex justify-between">
        <button onClick={prevStep} disabled={step === 1} className="text-slate-500 disabled:opacity-0 flex items-center gap-1">
          <ChevronLeft /> Back
        </button>
        <button onClick={nextStep} disabled={step === 3} className="bg-slate-700 px-6 py-2 rounded-lg flex items-center gap-1">
          Next <ChevronRight />
        </button>
      </div>
    </div>
  );
};
