// Verificar si la animación ya se vio
if (!localStorage.getItem("animacionVista")) {
    // Marcar que ya se vio
    localStorage.setItem("animacionVista", "true");

    // Tiempo total de animación
    const duracionAnimacion = 4500;

    setTimeout(() => {
        const contenedor = document.querySelector('.animacion-container');
        contenedor.style.transition = 'opacity 0.8s ease';
        contenedor.style.opacity = '0';

        // Después del fade out, ir al login
        setTimeout(() => {
            window.location.href = "index.html"; // tu login
        }, 800);
    }, duracionAnimacion);
} else {
    // Si ya se vio, ir directo al login
    window.location.href = "index.html";
}
