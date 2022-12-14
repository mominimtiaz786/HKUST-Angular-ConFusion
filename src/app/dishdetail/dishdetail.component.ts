import { Location } from '@angular/common';
import { Component, Input, OnInit, ViewChild, Inject } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { DishService } from '../services/dish.service';
import { Dish } from '../shared/dish';

import { switchMap } from 'rxjs/operators';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from '../shared/comment';


import { flyInOut, expand, visibility } from '../animations/app.animation';



@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
  },
  animations: [
    flyInOut(),
    expand(),
    visibility()
  ]
})
export class DishdetailComponent implements OnInit {

  visibility = 'shown';


  @Input() dish: Dish;
  dishIds: string[];
  dishErrMess: string;
  prev: string;
  next: string;
  dishcopy: Dish;

  @ViewChild('cform') commentFormDirective;
  userComment: Comment;
  commentForm: FormGroup;


  constructor(private location: Location,
    private dishService: DishService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    @Inject('BaseUrl') private BaseUrl) {
    this.createForm()
  }

  formErrors = {
    'author': '',
    'comment': '',
    'rating': ''
  };

  validationMessages = {
    'author': {
      'required': 'Name is required.',
      'minlength': 'Name must be at least 2 characters long.',
      'maxlength': 'Name cannot be more than 25 characters long.'
    },
    'comment': {
      'required': 'Comment is required.'
    },
    'rating': {
      'required': 'Rating is required.'
    }
  };

  createForm() {
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
      comment: ['', [Validators.required]],
      rating: [5, [Validators.required]]
    });

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged();
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

  onSubmit() {
    this.userComment = this.commentForm.value;
    this.userComment['date'] = new Date().toISOString();

    this.dishcopy.comments.push(this.userComment);
    // this.dish.comments.push(this.userComment);

    this.dishService.putDish(this.dishcopy)
      .subscribe(
        dish => {
          this.dish = dish;
          this.dishcopy = dish
        },
        errmess => {
          this.dish = null;
          this.dishcopy = null;
          this.dishErrMess = <any>errmess
        })

    this.commentFormDirective.resetForm();
    this.commentForm.reset({
      author: '',
      comment: '',
      rating: '5'
    });
  }

  ngOnInit() {
    this.dishService.getDishIds()
      .subscribe(dishIds => this.dishIds = dishIds,
        dishErrMess => this.dishErrMess = dishErrMess);

    this.route.params.pipe(
      switchMap(
        (params: Params) => {
          this.visibility = 'hidden';
          return this.dishService.getDish(params['id'])
        }
      ))
      .subscribe(dish => {
        this.dish = dish;
        this.dishcopy = dish;
        this.setPrevNext(dish.id);
        this.visibility = 'shown'
      });
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }
}
