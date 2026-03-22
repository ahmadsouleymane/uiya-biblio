// Définir la largeur max pour mobile (ici 768px)
const MOBILE_MAX_WIDTH = 425;

// Fonction pour vérifier la taille de l'écran
function checkScreenSize() {
  if (window.innerWidth > MOBILE_MAX_WIDTH) {
    // Bloquer l'accès et afficher un message
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
        padding: 1rem;
        background-color: #f0f0f0;
        color: #333;
        font-family: sans-serif;
      ">
        <p>
          Ce site est optimisé pour mobile.<br>
          Veuillez utiliser un smartphone pour y accéder.
        </p>
      </div>
    `;
  }
}

// Vérifier à l'ouverture
checkScreenSize();

// Vérifier si la fenêtre est redimensionnée
window.addEventListener("resize", checkScreenSize);