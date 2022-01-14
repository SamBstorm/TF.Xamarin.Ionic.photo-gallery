import { Component, OnInit } from '@angular/core';
import { IUserPhoto } from '../models/iuser-photo';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit{

  public photos: IUserPhoto[];

  constructor(private photoSrv : PhotoService) {}

  ngOnInit(): void {
    this.photos = this.photoSrv.photos;
  }
  
  public async addPhotoToGallery(){
    await this.photoSrv.addNewToGallery();
    this.photos = this.photoSrv.photos;
  }

}
