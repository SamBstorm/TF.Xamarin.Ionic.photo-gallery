import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

import { Injectable } from '@angular/core';
import { IUserPhoto } from '../models/iuser-photo';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  public photos : IUserPhoto[] = [];

  constructor() { }

  public async addNewToGallery(){
    //Prendre photo
    const capturedPhoto = await Camera.getPhoto({
      resultType : CameraResultType.Uri,
      source : CameraSource.Camera,
      quality : 100
    });

    //Sauvegarder la photo
    const savedImageFile = await this.savePicture(capturedPhoto);
    //Ajoute photo dans la gallerie
    this.photos.unshift(savedImageFile);
  }
  
  private async savePicture(photo: Photo): Promise<IUserPhoto>{
    // Conversion des données photo en 64Bit
    const base64Data = await this.readAsBase64(photo);

    //Definir le nom du fichier et l'enregistrer dans le system
    const filename : string = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path : filename,
      data : base64Data,
      directory : Directory.Data
    });

    //Retourne les positions de sauvegardes du fichier
    let info : IUserPhoto = {
      filePath : filename,
      webviewPath : photo.webPath
    };
    console.log(info);
    console.log(Directory.Data);
    return info;
  }

  private async readAsBase64(photo: Photo){
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    return await this.convertBlobAsBase64(blob) as string;
  }

  private convertBlobAsBase64 = (blob : Blob) => new Promise((resolve, reject)=>
  {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ()=>{
      resolve(reader.result);
    }
    reader.readAsDataURL(blob);
  });
}
