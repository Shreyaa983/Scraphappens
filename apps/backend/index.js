let appPromise;

export default async function handler(req, res) {
	try {
		if (!appPromise) {
			appPromise = import("./src/app.js");
		}

		const mod = await appPromise;
		const app = mod.default;
		return app(req, res);
	} catch (error) {
		console.error("Serverless bootstrap failed:", error);
		res.statusCode = 500;
		res.setHeader("Content-Type", "application/json");
		return res.end(JSON.stringify({
			error: "FUNCTION_BOOTSTRAP_FAILED",
			message: error?.message || "Backend failed to initialize",
		}));
	}
}
