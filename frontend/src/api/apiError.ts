import axios from 'axios';

export const extractApiErrorMessage = (error: unknown, fallback: string): string => {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as { message?: string } | undefined;
		return data?.message || error.message || fallback;
	}
	if (error instanceof Error)
		return error.message;
	return fallback;
};

export const buildApiError = (action: string, error: unknown): Error => {
	const fallback = `Failed to ${action}`;
	console.log(`❌ ${fallback}`);
	return new Error(extractApiErrorMessage(error, fallback));
};
