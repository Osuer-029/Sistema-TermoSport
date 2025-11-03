// Tiempo total de animación en milisegundos
const duracionAnimacion = 4500;

setTimeout(() => {
    const contenedor = document.querySelector('.animacion-container');
    contenedor.style.transition = 'opacity 0.8s ease';
    contenedor.style.opacity = '0';

    // Después de fade out, redirigir al login
    setTimeout(() => {
        window.location.href = "login.html"; // <-- tu login
    }, 800);
}, duracionAnimacion);
