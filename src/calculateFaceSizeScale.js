export default detectionStrength => {
    const s = detectionStrength
    if (s > 1000) {
        return 1.2
    } else if (s < 1000 && s > 900) {
        return 1.1
    } else if (s < 900 && s > 800) {
        return 1.08
    } else if (s < 800 && s > 700) {
        return 1.05
    } else if (s < 700 && s > 600) {
        return 1.01
    } else if (s < 600 && s > 500) {
        return 1.005
    } else if (s < 500 && s > 400) {
        return 1.001
    } else if (s < 400 && s > 300) {
        return 0.995 * 2
    } else if (s < 300 && s > 200) {
        return 0.99 /2
    } else if (s < 200 && s > 100) {
        return 0.95 /2
    } else if (s < 100 && s > 50) {
        return 0.9 /2
    } else {
        return 0.8
    } 
}