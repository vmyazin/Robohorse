export function updateMushroom(pickup, floorY, scrollDistance, timeScale = 1) {
    pickup.x -= scrollDistance;
    pickup.velY = (pickup.velY ?? 0) + 0.5 * timeScale;
    pickup.y += pickup.velY * timeScale;
    if (pickup.y + pickup.height >= floorY) {
        pickup.y = floorY - pickup.height;
        pickup.velY = 0;
    }
}
