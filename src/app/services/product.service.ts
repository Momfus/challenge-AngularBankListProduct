import { Injectable, signal } from '@angular/core';
import { environment } from '../../environment/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Product } from '../models/product.model';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {


  BASE_URL = environment.baseUrl;

  productListAux = new BehaviorSubject<Product[]>([]);
  productListFiltered: Product[] = [];

  isLoading = signal(false)

  headers = { 'authorId': environment.authId };

  constructor(
    private http: HttpClient,
  ) { }

  public getProducts(perPage: number = 5, offset: number = 0): Observable<Product[]> {


    if (this.productListAux.getValue().length === 0) {
      this.isLoading.set(true)

      return this.http
        .get<Product[]>(`${this.BASE_URL}`,  { headers: this.headers})
        .pipe(
          catchError((error) => {
            this.isLoading.set(false)
            return this.handleError(error);
          }),
          tap((products) => {
            this.isLoading.set(false)
            this.productListAux.next(products);
          })
        );
    } else {
      return this.productListAux.asObservable();
    }

  }


  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = "An unknown error ocurred!";
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(() => new Error(errorMessage));
    }

    // @TODO: Implementar manejo de errores
    switch (errorRes.error.error.message) {
      default:
        errorMessage = "This email does not exist";
        break;
    }

    return throwError(() => errorMessage);

  }

}