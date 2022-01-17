import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

import { Platform } from '@ionic/angular';

import { Injectable } from '@angular/core';
import { IUserPhoto } from '../models/iuser-photo';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  public photos : IUserPhoto[] = [];
  private PHOTOS_STORAGE : string = 'Photos'; 

  constructor(private plateform : Platform) { }

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
    
    /**Si on utilise l'objet Promise avec then() et catch()
     * 
     * //Prendre photo
    Camera.getPhoto({
      resultType : CameraResultType.Uri,
      source : CameraSource.Camera,
      quality : 100
    }).then(
      async datas =>{
      const savedImageFile = await this.savePicture(datas);
      //Ajoute photo dans la gallerie
      this.photos.unshift(savedImageFile);}
    );
      */
  
    //Sauvegarder liste photos dans la mémoire de l'application
    Storage.set({
      key : this.PHOTOS_STORAGE,
      value: JSON.stringify(this.photos)
    });
  }

  public async loadSaved(){
    const photolist = await Storage.get({ key : this.PHOTOS_STORAGE});
    this.photos = JSON.parse(photolist.value) ?? [];
    if(!this.plateform.is("hybrid")){
      for(let photo of this.photos){
        const readFile = await Filesystem.readFile({
          path : photo.filePath,
          directory : Directory.Data
        });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
        //photo.webviewPath = 'data:image/jpeg;base64,'+readFile.data;
      }
    }
  }

  public async deleteFromGallery(photo : IUserPhoto){
    if(this.plateform.is("hybrid")){
        await Filesystem.deleteFile({
        path: photo.filePath.substring(photo.filePath.lastIndexOf('/')+1),
        directory : Directory.Data
      });
    }
    this.photos.splice(this.photos.findIndex(p=>p.filePath == photo.filePath),1);
    Storage.set({
      key : this.PHOTOS_STORAGE,
      value: JSON.stringify(this.photos)
    });
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
    if(this.plateform.is("hybrid")){
      return {
        filePath: savedFile.uri,
        webviewPath : Capacitor.convertFileSrc(savedFile.uri)
      };
    }
    else{
      return {
        filePath : filename,
        webviewPath : photo.webPath
      };
    }
    
  }

  private async readAsBase64(photo: Photo){
    if(this.plateform.is("hybrid")){
      const file = await Filesystem.readFile({
        path : photo.path
      });
      return file.data;
    }
    else
    {
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      return await this.convertBlobAsBase64(blob) as string;
    }
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
