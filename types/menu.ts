/**
 * Menu API Types
 */

export interface MenuItem {
  id: number;
  title: string;
  url: string;
  parent: string;
  order: number;
  classes: string[];
  target?: string;
  attr_title?: string;
}

export interface Menu {
  menu_id: number;
  menu_name: string;
  menu_slug: string;
  items: MenuItem[];
}

export interface MenuItemWithChildren extends MenuItem {
  children?: MenuItemWithChildren[];
}

