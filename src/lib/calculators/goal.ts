/**
 * Goal planner with exact integer maths. The goal cost grows with inflation
 * once a year; savings and the monthly SIP grow at the expected return with
 * monthly compounding, instalments at the start of each month (the same
 * convention as the SIP calculator). Rounded to the paisa only at the end.
 * No imports, so Node tests can run it.
 */

const Q = 120_000n; // monthly rate = bp ÷ 120000

export type GoalInput = {
  costTodayPaise: number;
  years: number;
  inflationBp: number;
  returnBp: number;
  savedPaise: number;
};

export type GoalResult = {
  goalPaise: number;
  savingsGrowPaise: number;
  /** Zero when current savings are expected to cover the goal. */
  monthlySipPaise: number;
  lumpSumTodayPaise: number;
  totalSipPaise: number;
  covered: boolean;
};

function roundDiv(n: bigint, d: bigint): bigint {
  if (d < 0n) return roundDiv(-n, -d);
  return n >= 0n ? (2n * n + d) / (2n * d) : -((2n * -n + d) / (2n * d));
}

export function planGoal({ costTodayPaise, years, inflationBp, returnBp, savedPaise }: GoalInput): GoalResult {
  const m = BigInt(years * 12);
  const infNum = (10_000n + BigInt(inflationBp)) ** BigInt(years);
  const infDen = 10_000n ** BigInt(years);
  const r = BigInt(returnBp);
  const a = Q + r;
  const am = a ** m;
  const qm = Q ** m;
  const C = BigInt(costTodayPaise);
  const S = BigInt(savedPaise);

  // Goal F = C·infNum/infDen; savings grow to S·am/qm; gap = F − S·am/qm.
  const gapNum = C * infNum * qm - S * am * infDen; // over infDen·qm
  const goalPaise = roundDiv(C * infNum, infDen);
  const savingsGrowPaise = roundDiv(S * am, qm);
  const covered = gapNum <= 0n;

  let sip = 0n;
  let lump = 0n;
  if (!covered) {
    // SIP = gap × r × qm ÷ ((am − qm) × a); with r = 0, SIP = gap ÷ m.
    sip = r === 0n ? roundDiv(gapNum, infDen * qm * m) : roundDiv(gapNum * r, infDen * (am - qm) * a);
    // One-time today = gap ÷ growth = gapNum ÷ (infDen · am).
    lump = roundDiv(gapNum, infDen * am);
  }
  const totalSip = covered ? 0n : r === 0n ? roundDiv(gapNum, infDen * qm) : roundDiv(gapNum * r * m, infDen * (am - qm) * a);
  return {
    goalPaise: Number(goalPaise),
    savingsGrowPaise: Number(savingsGrowPaise),
    monthlySipPaise: Number(sip),
    lumpSumTodayPaise: Number(lump),
    totalSipPaise: Number(totalSip),
    covered,
  };
}

/** Projected value at the end of each year (rupees, for the chart only). */
export function goalPath(sipPaise: number, savedPaise: number, returnBp: number, years: number): number[] {
  const i = returnBp / 120_000;
  return Array.from({ length: years }, (_, y) => {
    const k = (y + 1) * 12;
    const g = Math.pow(1 + i, k);
    const sip = i === 0 ? sipPaise * k : sipPaise * ((g - 1) / i) * (1 + i);
    return (sip + savedPaise * g) / 100;
  });
}
