const ratio = document.getElementById("ratio");
const hitTime = document.getElementById("hitTime");
const missTime = document.getElementById("missTime");

function calculate() {
    const r = Number(ratio.value) / 100;
    const hit = Number(hitTime.value);
    const miss = Number(missTime.value);
    const average = r * hit + (1 - r) * miss;
    document.getElementById("ratioLabel").textContent = `${ratio.value}%`;
    document.getElementById("avg").textContent = formatMs(average);
    document.getElementById("dbCalls").textContent = Math.round((1 - r) * 1000).toLocaleString();
    document.getElementById("speedup").textContent = average === 0 ? "∞" : `${(miss / average).toFixed(1)}x`;
}

[ratio, hitTime, missTime].forEach(input => input.addEventListener("input", calculate));
calculate();
