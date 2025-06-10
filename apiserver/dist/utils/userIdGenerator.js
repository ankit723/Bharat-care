"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUserId = generateUserId;
/**
 * Generates a userId based on the name pattern: initials_randomNumber
 * Example: "John Doe" -> "jd_12345"
 */
function generateUserId(name) {
    // Extract initials from the name
    const initials = name
        .split(' ')
        .map(part => part.charAt(0).toLowerCase())
        .join('');
    // Generate a random 5-digit number
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    // Combine initials with random number
    return `${initials}_${randomNum}`;
}
