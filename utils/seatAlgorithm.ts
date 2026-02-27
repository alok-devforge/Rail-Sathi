import { SplitJourney, SeatLeg } from '../types';
import { MOCK_SEAT_CHART, MOCK_TRAINS, SeatEntry } from '../data/mockData';

// Helper: Get station index from the train's route
const getStationIdx = (route: any[], code: string) => 
  route.findIndex((s) => s.code === code);

/**
 * 🚀 IMPROVED: Checks if a seat covers the requested segment.
 * Handles "Subset" logic: If seat is free A->C, it returns TRUE for A->B.
 */
function isSeatAvailableForSegment(
  seat: SeatEntry,
  reqSrcIdx: number,
  reqDstIdx: number,
  route: any[]
): boolean {
  return Object.entries(seat.availability).some(([key, status]) => {
    if (status !== 'AVAILABLE') return false;

    const [availSrc, availDst] = key.split('-');
    const availSrcIdx = getStationIdx(route, availSrc);
    const availDstIdx = getStationIdx(route, availDst);

    // Valid if the Available Segment completely encompasses the Requested Segment
    // AvailSrc ... ReqSrc ... ReqDst ... AvailDst
    return (availSrcIdx <= reqSrcIdx) && (availDstIdx >= reqDstIdx);
  });
}

export function findSmartSeats(
  trainId: string,
  sourceCode: string,
  destCode: string
): SplitJourney | null {
  const train = MOCK_TRAINS.find((t) => t.id === trainId);
  if (!train) return null;

  const route = train.route;
  const srcIdx = getStationIdx(route, sourceCode);
  const dstIdx = getStationIdx(route, destCode);

  if (srcIdx === -1 || dstIdx === -1 || srcIdx >= dstIdx) return null;

  const trainSeats = MOCK_SEAT_CHART.filter((s) => s.trainId === trainId);

  // ── Step 1: DIRECT Check (Using Improved Logic) ──
  const directSeat = trainSeats.find((seat) =>
    isSeatAvailableForSegment(seat, srcIdx, dstIdx, route)
  );

  if (directSeat) {
    return {
      type: 'DIRECT',
      isConfirmed: true,
      legs: [{
        fromStation: sourceCode, toStation: destCode,
        seatNumber: directSeat.seatNumber, status: 'AVAILABLE'
      }],
      totalFare: calculateFare(srcIdx, dstIdx), // Standard Fare
    };
  }

  // ── Step 2: SPLIT Check ──
  for (let midIdx = srcIdx + 1; midIdx < dstIdx; midIdx++) {
    const midCode = route[midIdx].code;

    // Find seat for First Leg (Src -> Mid)
    const legASeat = trainSeats.find((seat) =>
      isSeatAvailableForSegment(seat, srcIdx, midIdx, route)
    );
    
    // Find seat for Second Leg (Mid -> Dest)
    const legBSeat = trainSeats.find((seat) =>
      isSeatAvailableForSegment(seat, midIdx, dstIdx, route)
    );

    if (legASeat && legBSeat) {
      // ⚠️ Use separate fares for split tickets
      const fareA = calculateFare(srcIdx, midIdx);
      const fareB = calculateFare(midIdx, dstIdx);

      return {
        type: 'SPLIT',
        isConfirmed: true,
        legs: [
          { fromStation: sourceCode, toStation: midCode, seatNumber: legASeat.seatNumber, status: 'AVAILABLE' },
          { fromStation: midCode, toStation: destCode, seatNumber: legBSeat.seatNumber, status: 'AVAILABLE' },
        ],
        totalFare: fareA + fareB, // Sum of partial fares
      };
    }
  }

  return null;
}

function calculateFare(srcIdx: number, dstIdx: number): number {
  const base = 250;
  const perStop = 85;
  // This simple linear math is fine for a demo
  return base + (dstIdx - srcIdx) * perStop;
}