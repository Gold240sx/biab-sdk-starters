import { ChangeDetectionStrategy, Component } from "@angular/core";

import { AboutComponent } from "./sections/about.component";
import { BlogComponent } from "./sections/blog.component";
import { ContactFormComponent } from "./sections/contact-form.component";
import { FooterComponent } from "./sections/footer.component";
import { HeaderComponent } from "./sections/header.component";
import { HeroComponent } from "./sections/hero.component";
import { ServicesComponent } from "./sections/services.component";

@Component({
	selector: "app-root",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		HeaderComponent,
		HeroComponent,
		AboutComponent,
		ServicesComponent,
		BlogComponent,
		ContactFormComponent,
		FooterComponent,
	],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
})
export class App {}
