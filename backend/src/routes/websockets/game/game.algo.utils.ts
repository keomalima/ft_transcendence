export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function getRandom(min: number, max: number) {
	return Math.random() * (max - min) + min;
}