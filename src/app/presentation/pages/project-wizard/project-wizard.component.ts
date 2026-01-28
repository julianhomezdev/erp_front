import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ProjectWizardComponent } from "../../components/project-wizard/project-wizard.component";

@Component({
        
    selector: 'wizard-page',
    standalone: true,
    imports: [CommonModule, ProjectWizardComponent],
    templateUrl: './project-wizard.component.html',
        
})

export class WizardPage {}

