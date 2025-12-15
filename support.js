/* =========================
   EMAILJS INIT
   ========================= */
(function () {
  emailjs.init("TDqu6RA_k-QAGQkIa");
})();

/* =========================
   TICKET ID GENERATOR
   ========================= */
function generateTicketID(length = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "AC-";
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/* =========================
   OTHER FIELD TOGGLING
   ========================= */
document.querySelectorAll(".form-group").forEach(group => {
  const select = group.querySelector(".other-trigger");
  const otherBox = group.querySelector(".other-box");

  if (!select || !otherBox) return;

  otherBox.style.display = "none";
  otherBox.required = false;

  select.addEventListener("change", () => {
    const isOther = select.value === "Other";
    otherBox.style.display = isOther ? "block" : "none";
    otherBox.required = isOther;
    if (!isOther) otherBox.value = "";
  });
});

/* =========================
   FORM SUBMIT
   ========================= */
const form = document.getElementById("support-form");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  /* Email confirm check */
  const email = form.querySelector('[name="email"]').value.trim();
  const confirm = form.querySelector('[name="email_confirm"]').value.trim();
  if (email !== confirm) {
    alert("Email addresses do not match.");
    return;
  }

  /* Resolve DEVICE */
  const deviceSelect = form.querySelector('[name="device"]');
  const deviceOther = form.querySelector('[name="device_other"]');
  if (deviceSelect.value === "Other" && deviceOther.value.trim()) {
    deviceSelect.value = deviceOther.value.trim();
  }

  /* Resolve ISSUE TYPE */
  const issueSelect = form.querySelector('[name="issue_type"]');
  const issueOther = form.querySelector('[name="issue_other"]');
  if (issueSelect.value === "Other" && issueOther.value.trim()) {
    issueSelect.value = issueOther.value.trim();
  }

  /* Ticket ID (persistent for both emails) */
  let ticket = form.querySelector('[name="ticket_id"]');
  if (!ticket) {
    ticket = document.createElement("input");
    ticket.type = "hidden";
    ticket.name = "ticket_id";
    form.appendChild(ticket);
  }
  ticket.value = generateTicketID();

  const submitBtn = form.querySelector(".form-submit");
  submitBtn.disabled = true;
  submitBtn.innerText = "Sending…";

  /* USER CONFIRMATION EMAIL */
  emailjs.sendForm(
    "service_qffvwxe",
    "template_o4msykw",
    form
  )
  .then(() => {
    /* INTERNAL STAFF EMAIL */
    return emailjs.sendForm(
      "service_qffvwxe",
      "template_l98k8fh",
      form
    );
  })
  .then(() => {
    alert(`Ticket submitted successfully.\n\nReference: ${ticket.value}`);
    form.reset();
    document.querySelectorAll(".other-box").forEach(b => {
      b.style.display = "none";
      b.required = false;
    });
  })
  .catch(err => {
    console.error(err);
    alert("Ticket sent, but internal notification may have failed.");
  })
  .finally(() => {
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Ticket";
  });
});
