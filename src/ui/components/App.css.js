import { css } from "lit";

export const style = css`
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family : adobe-clean;
  }

  body {
    background-color: #fff;
   
  }

  .first-page {
    position : absolute;
    z-index : 1;
    top : 0;
    height : 100vw;
    width : 95vw;

  }

  .second-page {
    position : absolute;
    z-index : 2;
    top : 0;
    height : 100vw;
    width : 92vw;
    display : none;
    
    
  }

  .title {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .title > p {
    color: rgb(177, 177, 177);
    font-weight: 500;
    display: flex;
    align-items: center;
  }

  .hero-icon {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    cursor: pointer;
  }

  .hero-icon > div {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f5f5;
    border-radius: 14px;
    height: 100px;
    width: 100px;
    margin-top: 10px;
  }

  #shield {
    margin: auto;
  }

  #checkmark-circle {
    position: absolute;
    z-index: 1;
    bottom: 20px;
    right: 42.5%;
  }

  .hero-head {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    margin-top: 25px;
  }

  .hero-head > div {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    /* height: 100px; */
    width: 200px;
    margin-top: 10px;
    text-align: center;
  }

  .hero-head > div > p {
    color: #757474;
    display: flex;
    font-size: 1rem;
    flex-wrap: wrap;
  }

  .brand-box {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    background-color: #f5f5f5;
    padding: 20px 25px;
    width: 80vw;
    margin: 25px auto;
    border-radius: 14px;
    flex-direction: column;
  }

  .brand-choose-text {
    font-size: 0.9rem;
    margin-bottom: 15px;
  }

  sp-picker {
    border-radius: 5px;
    border: 1px solid #c2c0c0;
    margin-bottom: 18px;
  }

  sp-menu-item {
    padding: 10px 20px;
  }

  .brand-box p {
    margin-bottom: 15px;
    color: #a8a4a4;
  }

  .brand-box > div {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .line {
    background-color: #a8a4a4;
    height: 2px;
    width: 100%;
    margin-top: 8px;
  }

  sp-button {
    margin-bottom: 5px;
    padding: 0px 10px;
    width: 100%;
    padding-bottom: 4px;
  }

  sp-button > svg {
    display: inline-flex;
    padding-top: 10px;
  }

  .continue-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 5px;
    
  }
  .continue-button > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* for second page*/
  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .divider {
    margin: 15px 5px;
  }

  .guidelines {
    margin: 15px 5px;
  }

  .guidelines > h4 {
    font-size: 1.1rem;
    margin-bottom: 8px;
  }

  .guidelines > input {
    background-color: #f3f3f3;
    width: 100%;
    border: 1px solid #b6b4b4;
    border-radius: 5px;
    padding: 10px 5px;
  }


  .manual-add {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .divider {
    margin: 15px 5px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color:rgb(26, 25, 25);
  }   

  .manual-heading {
    margin-left: 5px;
    display: flex;
    align-items: center;
  }

  .manual-heading > h5 {
    font-size: 1.2rem;
    font-weight: 600;
  }

  .brand-name {
    margin: 15px 5px;
  }

  .brand-name > p {
    font-size: 1rem;
    font-weight: 500;
  }

  .brand-name > input {
    border-radius: 5px;
    background-color: #f3f3f3;
    border: 1px solid #b6b4b4;
    padding: 15px 5px;
    margin-top: 10px;
    width: 100%;
  }

  .brand-name > input::placeholder {
    color: #464646;
  }

  .brand-logo {
    margin: 15px 5px;
    background-color: #f3f3f3;
    border: 1px solid #b6b4b4;
    border-radius: 5px;
    padding: 15px 10px;
    display: flex;
    justify-content: space-between;
    box-shadow: 0 6px 10px -6px rgb(131, 129, 129);
  }

  .brand-logo-text {
    display: flex;
    flex-direction: column;
  }

  .brand-logo-text > h4 {
    font-size: 1.1rem;
    margin-bottom: 5px;
  }

  .brand-logo-text > p {
    color: #686666;
    font-size: 0.9rem;
    margin-bottom: 20px;
  }

  #upload > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-logo-image {
    height: 100px;
    width: 100px;
    border-radius: 5px;
  }

  .brand-logo-image > svg {
    border-radius: 14px;
  }

  .tagline {
    margin: 15px 5px;
  }

  .tagline > h4 {
    font-size: 1.1rem;
    margin-bottom: 8px;
  }
  
  .tagline > input {
    background-color: #f3f3f3;
    width: 100%;
    border: 1px solid #b6b4b4;
    border-radius: 5px;
    padding: 10px 5px;
  }
  
  
  .typography {
    margin: 25px 5px;
  }

  .typography > h4 {
    margin-bottom: 8px;
    font-size: 1.1rem;
  }

  .typography > p {
    color: #686666;
    margin-bottom: 15px;
  }

  .add-font-btn {
    padding: 5px 8px;
    width : fit-content;
    background-color: #f3f3f3;
    border: 1px dashed rgb(82, 88, 228);
    border-radius: 17.5px;
    transition: all 0.3s;
  }

  .add-font-btn:hover {
    opacity: 0.8;
  }

  .add-font-btn > div {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111;
  }

  .brand-size {
    margin: 10px 5px;
    display: flex;
    gap: 20px;
  }

  .min-size-div,
  .max-size-div {
    width: auto;
  }

  .min-size-div > sp-field-label,
  .max-size-div > sp-field-label {
    font-size: 0.8rem;
  }

  .min-size-div > input,
  .max-size-div > input {
    background-color: #f3f3f3;
    width: 65px;
    border: 1px solid #b6b4b4;
    border-radius: 5px;
    padding: 5px;
  }

  .brand-color {
    // margin: 15px 5px;
    margin-top: 15px;
    margin-left: 5px;
    margin-right: 5px;
    margin-bottom: 5px;
  }

  .brand-color > h4 {
    font-size: 1.1rem;
  }

  .color {
    margin: 10px 0px;
    padding: 10px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f3f3f3;
    border: 1px solid #d1cfcf;
    border-radius: 5px;
  }

  .color-info {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  .show-color {
    height: 30px;
    width: 30px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid transparent;
  }

  .show-color:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .edit-color {
    cursor: pointer;
    transition: opacity 0.3s;
  }

  .edit-color:hover {
    opacity: 0.8;
  }

  .add-color-btn {
    background-color: transparent;
    color: #5258e4;
    padding: 5px;
    width : fit-content;
  }

  .add-color-btn:hover {
    background-color: #f3f3f3;
  }

  .add-color-btn > div {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .typography {
    position: relative;
  }

  .selected-font-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background-color: #f3f3f3;
    border: 1px dashed #5258e4;
    border-radius: 17.5px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .selected-font-tag:hover {
    background-color: #e9e9e9;
  }

  .selected-font-tag svg {
    transition: opacity 0.2s;
  }

  .selected-font-tag svg:hover {
    opacity: 0.7;
  }

  .font-picker-dropdown {
    position: absolute;
    left: 0;
    top: 100%;
    margin-top: 5px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1002;
    max-height: 300px;
    overflow-y: auto;
    min-width: 200px;
    max-width: 250px;
  }

  .font-picker-item {
    padding: 10px 15px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s;
  }

  .font-picker-item:hover {
    background-color: #f9f9f9;
  }

  .layout-spacing {
    margin: 10px 5px;
  }

  .layout-spacing > h4 {
    font-size: 1.1rem;
    margin-bottom: 8px;
  }

  .layout-spacing  sp-field-label {
    font-size: 0.8rem;
  }

  .layout-spacing  input {
    background-color: #f3f3f3;
    width: 65px;
    border: 1px solid #b6b4b4;
    border-radius: 5px;
    padding: 5px;
  }

  .layout-spacing-item {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 10px;
  } 

  .layout-spacing-item > div {
    margin-bottom: 10px;
  }

  /* Brand menu item with delete button */
  sp-menu-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 30px !important;
  }

  sp-menu-item .brand-delete-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  sp-menu-item:hover .brand-delete-btn {
    opacity: 1;
  }

  sp-menu-item .brand-delete-btn:hover {
    opacity: 1;
    fill: #FF5D5D;
  }
  

`;
