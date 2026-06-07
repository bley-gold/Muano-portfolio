const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const menuButton = document.querySelector(".menu-button");
const menu = document.querySelector(".menu");
const menuLinks = document.querySelectorAll(".menu a");
const reveals = document.querySelectorAll(".reveal");
const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
const magneticElements = document.querySelectorAll(".magnetic");
const tiltCards = document.querySelectorAll(".tilt-card, .project-card");

window.addEventListener("load", () => {
  window.setTimeout(() => document.querySelector(".loader").classList.add("done"), 650);
});

menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menu.classList.toggle("open", !open);
  document.body.classList.toggle("menu-open", !open);
});

menuLinks.forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    menu.classList.remove("open");
    document.body.classList.remove("menu-open");
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14 }
);

reveals.forEach((element) => revealObserver.observe(element));

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = Number(entry.target.dataset.count);
      const duration = 1100;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        entry.target.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.7 }
);

document.querySelectorAll("[data-count]").forEach((counter) => counterObserver.observe(counter));

if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;

  document.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  const renderCursor = () => {
    ringX += (mouseX - ringX) * 0.14;
    ringY += (mouseY - ringY) * 0.14;
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(renderCursor);
  };
  renderCursor();

  document.querySelectorAll("a, button").forEach((element) => {
    element.addEventListener("pointerenter", () => cursorRing.classList.add("active"));
    element.addEventListener("pointerleave", () => cursorRing.classList.remove("active"));
  });

  magneticElements.forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });

  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1200px) rotateX(${-y * 2.5}deg) rotateY(${x * 2.5}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

const canvas = document.querySelector("#network-canvas");
const context = canvas.getContext("2d");
let nodes = [];
let pointer = { x: -1000, y: -1000 };

const sizeCanvas = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(58, Math.max(22, Math.floor(window.innerWidth / 24)));
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.23,
    vy: (Math.random() - 0.5) * 0.23,
    radius: Math.random() * 1.6 + 0.8,
  }));
};

const drawNetwork = () => {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  nodes.forEach((node, index) => {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < 0 || node.x > window.innerWidth) node.vx *= -1;
    if (node.y < 0 || node.y > window.innerHeight) node.vy *= -1;

    const pointerDistance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
    if (pointerDistance < 130) {
      node.x += (node.x - pointer.x) * 0.006;
      node.y += (node.y - pointer.y) * 0.006;
    }

    context.beginPath();
    context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(223, 255, 0, 0.75)";
    context.fill();

    nodes.slice(index + 1).forEach((other) => {
      const distance = Math.hypot(node.x - other.x, node.y - other.y);
      if (distance > 135) return;
      context.beginPath();
      context.moveTo(node.x, node.y);
      context.lineTo(other.x, other.y);
      context.strokeStyle = `rgba(241, 237, 223, ${0.12 * (1 - distance / 135)})`;
      context.stroke();
    });
  });

  requestAnimationFrame(drawNetwork);
};

window.addEventListener("pointermove", (event) => {
  pointer = { x: event.clientX, y: event.clientY };
});

window.addEventListener("resize", sizeCanvas);
sizeCanvas();
if (!prefersReducedMotion) drawNetwork();

document.querySelector("#year").textContent = new Date().getFullYear();
