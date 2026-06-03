export function Footer() {
	return (
		<footer className="app-footer">
			<div>© {new Date().getFullYear()} Your Business. All rights reserved.</div>
			<div>
				Built with{" "}
				<a href="https://github.com/Gold240sx/business-in-a-box">@biab-dev/sdk</a>
			</div>
		</footer>
	);
}
