import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../../models/product.model';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';
import { releaseDateValidator } from '../../../../utils/validators';
import { ProductService } from '../../../services/product.service';
import { Observable, map } from 'rxjs';
import { setTodayDate } from '../../../../utils/helpers';

@Component({
  selector: 'app-edit-product-form',
  standalone: false,
  templateUrl: './edit-product-form.component.html',
  styleUrl: '../product-form.scss'
})
export class EditProductFormComponent {

  @Input() productId!: string;
  @Output() submitForm: EventEmitter<Product> = new EventEmitter<Product>();

  today!: string;
  initialProductValues!: Product;

  form = this.fb.group({
    id: [
      {value: '', disabled: true},
      [this.checkProductIdNotTaken.bind(this)],
    ],
    name: [
      "",
      [Validators.required, Validators.minLength(5), Validators.maxLength(100)],
    ],
    description: [
      "",
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200),
      ],
    ],
    logo: ["", Validators.required],
    date_release: [
      formatDate(new Date(), "yyyy-MM-dd", "en-US"),
      [Validators.required, releaseDateValidator()],
    ],
    date_revision: [{ value: "", disabled: true }],
  });

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.today = setTodayDate();
  }


  ngOnInit(): void {
    this.subscribeToReleaseDateChanges();
    this.productService.getProductById(this.productId).subscribe({
      next: product => {
        this.setFormDefaultValue(product);
        this.initialProductValues = product;
      },
    });
  }

  onSubmit(): void {

    if (this.form.invalid || this.form.pristine ) {
      return;
    }

    const formValue = this.form.value;
    const product: Product = {
      id: this.productId,
      name: (formValue.name || '').trim(),
      description: (formValue.description || '').trim(),
      logo: (formValue.logo || '').trim(),
      date_release: new Date(formValue.date_release || Date.now()),
      date_revision: new Date(formValue.date_revision || Date.now()),
    };

    this.submitForm.emit(product);

  }

  onReset(event: Event): void {

    event.preventDefault();
    if (this.form.pristine) {
      return;
    }

    this.setFormDefaultValue(this.initialProductValues);

  }

  checkProductIdNotTaken(
    control: AbstractControl
  ): Observable<ValidationErrors
   | null> {
    return this.productService
      .verifyProductId(control.value)
      .pipe(map((res) => (res ? { idTaken: true } : null)));
  }

  setFormDefaultValue(product: Product) {
    this.form.patchValue({
      id: this.productId,
      name: product.name,
      description: product.description,
      logo: product.logo,
      date_release: formatDate(product.date_release, "yyyy-MM-dd", "en-US"),
    });
  }

  /**
   * Subscribe to changes in the releaseDate field of the form.
   * When the releaseDate changes, set the reviewDate to be one year after the new releaseDate.
   */
  private subscribeToReleaseDateChanges(): void {
    this.form.get("date_release")?.valueChanges.subscribe((val) => {
      if (val) {
        let releaseDateParts = val.split("-").map((part) => parseInt(part, 10));
        let reviewDate = new Date(
          releaseDateParts[0] + 1,
          releaseDateParts[1] - 1,
          releaseDateParts[2]
        );
        let formattedDate = formatDate(reviewDate, "yyyy-MM-dd", "en-US");
        this.form.get("date_revision")?.setValue(formattedDate);
      }
    });
  }
}
