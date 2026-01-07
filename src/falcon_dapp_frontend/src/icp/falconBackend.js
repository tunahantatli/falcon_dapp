let cachedBackendPromise;
let cachedBackend;

const OFFLINE_BACKEND = {
	async login() {
		return { plan: null, status: 'offline' };
	},
};

export async function getFalconBackend() {
	if (cachedBackend) return cachedBackend;
	if (cachedBackendPromise) return cachedBackendPromise;

	cachedBackendPromise = (async () => {
		try {
			const declarationsPath = '../../../declarations/falcon_dapp_backend';
			const mod = await import(/* @vite-ignore */ declarationsPath);
			cachedBackend = mod?.falcon_dapp_backend || OFFLINE_BACKEND;
			return cachedBackend;
		} catch {
			cachedBackend = OFFLINE_BACKEND;
			return cachedBackend;
		} finally {
			cachedBackendPromise = undefined;
		}
	})();

	return cachedBackendPromise;
}
