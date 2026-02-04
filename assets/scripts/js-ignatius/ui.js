export function bindChips(containerId, minPick=0){
  const container = document.getElementById(containerId);
  if (!container) return { getSelected: () => [] };

  const selected = new Set();
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;

    const label = btn.dataset.chip;
    const isOn = btn.getAttribute("aria-pressed") === "true";
    btn.setAttribute("aria-pressed", String(!isOn));

    if (isOn) selected.delete(label);
    else selected.add(label);
  });

  return {
    getSelected(){
      return Array.from(selected);
    },
    validate(){
      if (minPick && selected.size < minPick){
        alert(`Pick at least ${minPick} categories.`);
        return false;
      }
      return true;
    }
  };
}

export function bindImagePreview(fileInputId, boxId){
  const input = document.getElementById(fileInputId);
  const box = document.getElementById(boxId);
  if (!input || !box) return;

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    box.style.backgroundImage = `url(${url})`;
    box.style.backgroundSize = "cover";
    box.style.backgroundPosition = "center";
  });
}
