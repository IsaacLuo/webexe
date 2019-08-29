// import { 
//   IUser,
//   IProject, 
// } from './types';
// import mongoose, { Model, Document } from 'mongoose'
// import {Schema} from 'mongoose'

// export const UserSchema = new Schema({
//   email: String,
//   passwordHash: String, // empty if user signed up using google account
//   passwordSalt: String, // empty if user signed up using google account
//   name: String, // user's full name
//   groups: [String], // array of group name, 'guest', 'users', 'visitors', or 'administrators'
//   createdAt: Date,
//   updatedAt: Date,
// });

// export interface IUserModel extends IUser, Document{

// }

// export const User:Model<IUserModel> = mongoose.model('User', UserSchema, 'users');

// export const PartDetailSchema = new Schema({
//   name: String,
//   comment: String,
// }, {_id:false});


// export const PartsSchema = new Schema({
//   position: Number,
//   activated: Boolean,
//   selected: Boolean,
//   partName: String,
//   partDetail: PartDetailSchema,
// }, {_id:false});

// export const ProjectSchema = new Schema({
//   name: String,
//   version: String,
//   parts: [PartsSchema],
//   connectorIndexes: [Number],
//   owner: Schema.Types.ObjectId,
//   group: String,
//   createdAt: Date,
//   updatedAt: Date,
//   history: [Schema.Types.Mixed],
// });

// export interface IProjectModel extends IProject, Document{

// }

// export const Project:Model<IProjectModel> = mongoose.model('Project', ProjectSchema, 'projects');

// export const AssemblySchema = new Schema({
//   project: {
//     type: Schema.Types.ObjectId,
//     ref: 'Project',
//   },
//   finalParts: [{
//     name: String,
//     sequence: String,
//   }]
// });

// export interface IAssembly {
//   project: string|IProjectModel,
//   finalParts: Array<{
//     name: string,
//     sequence: string,
//   }>
// }

// export interface IAssemblyModel extends IAssembly, Document {}
// export const Assembly:Model<IAssemblyModel> = mongoose.model('Assembly', AssemblySchema, 'assemblies');

// export const AssemblyListSchema = new Schema({
//   assemblies: [{
//     type: Schema.Types.ObjectId,
//     ref: 'Assembly',
//   }],
//   owner: Schema.Types.ObjectId,
//   createdAt: Date,
// })
// export interface IAssemblyList {
//   assemblies: Array<Model<IAssemblyModel>>|string[];
//   owner: string;
//   createdAt: Date;
// }
// export interface IAssemblyListModel extends IAssemblyList, Document {}
// export const AssemblyList:Model<IAssemblyListModel> = mongoose.model('AssemblyList', AssemblyListSchema, 'assembly_lists');


// export const PartDefinitionSchema = new Schema({
//   owner: Schema.Types.ObjectId,
//   group: String,
//   createdAt: Date,
//   updatedAt: Date,
//   permission: Number,
//   part: {
//     position: String,
//     name: String,
//     labName: String,
//     category: String,
//     subCategory: String,
//     comment: String,
//     sequence: String,
//     plasmidLength: Number,
//     backboneLength: Number,
//   },
// })
// export interface IPartDefinition {
//   owner: string;
//   group: string;
//   createdAt: Date;
//   updatedAt: Date;
//   permission: number;
//   part: {
//     pos:number;
//     position: string;
//     name: string;
//     labName: string;
//     category: string;
//     subCategory: string;
//     comment: string;
//     sequence: string;
//     plasmidLength: number;
//     backboneLength: number;
//   }
// }
// export interface IPartDefinitionModel extends IPartDefinition, Document {}
// export const PartDefinition:Model<IPartDefinitionModel> = mongoose.model('PartDefinition', PartDefinitionSchema, 'part_definitions');


// export interface IPlateDefinition {
//   owner: string;
//   group: string;
//   createdAt: Date;
//   updatedAt: Date;
//   permission: number;
//   plateType: '96'|'384';
//   name: string;
//   barcode: string;
//   parts: Array<IPartDefinition|string>;
// }

// export const PlateDefinitionSchema = new Schema({
//   owner: Schema.Types.ObjectId,
//   group: String,
//   createdAt: Date,
//   updatedAt: Date,
//   permission: Number,
//   plateType: String,
//   name: String,
//   barcode: String,
//   parts: [{
//     type: Schema.Types.ObjectId,
//     ref: 'PartDefinition',
//   }],
// });

// export interface IPlateDefinitionModel extends IPlateDefinition, Document {}
// export const PlateDefinition:Model<IPartDefinitionModel> = mongoose.model('PlateDefinition', PlateDefinitionSchema, 'plate_definition');
