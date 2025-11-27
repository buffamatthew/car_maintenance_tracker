
# Objective
Hey Claude. I would like to create a docker-based web application I will host locally which can track some simple maintenance for cars in my household. I will plan to access the site on mobile and desktop browsers. I don't want you to implement it all at once, but come up with a plan to implement it.

# Dashboard
Shows gauges/charts for maintenance items for the currently selected vehicle. Shows current mileage for vehicle. Shows overview of each maintenance item and how much time (or miles) before the item needs attention. Show an overview of all of the mainteance items for every vehicle in the system to give an overview.

## Vehicle selector
Allow user to select a vehicle in the household from a list, updates the visible gauges to show the selected vehicle.

## Add Maintenance Log button
Accessed anytime maintenance is performed for the currently selected vehicle. Brings user to the Maintenance Log UI.

## Add vehicle button
Allow the user to add a vehicle to the system they'd like to track. Brings user to the Add Vehicle UI.

## Settings
TBD, user management (credentials, permissions), other settings

# Add Vehicle UI
* Add cars to the system with basic vehicle info (year, make model, engine type).
* Create a list of maintenance items and their frequency for the vehicle (either time based or mileage based). Ideally this could be populated from manuals or online information after entering the basic vehicle info, instead of being manually entered. Would like to explore options here.
* Some examples of maintenace items
    * Tire rotation
        * Type: Mileage-based 
        * Frequency: 10K miles
    * Oil
        * Type: Mileage-based
        * Frequency: 8K miles
        * Notes: Filter: FRAM PH3614, oil: 5.7qt SAE 5W-30 full synthetic
    * Battery
        * Type: Time-based
        * Frequency: 3 years
        * Notes: Group Size 48 H6
    * Wiper blades
        * Type: Time-based
        * Frequency: 1 year
        * Notes: Passenger size: 18, driver size: 24

# Maintenance log UI
* Update maintenance for a particular item for the currently selected vehicle. Accessed whenever maintenace is performed. 
* This UI should query which maintenance can be performed for the selected vehicle so the user can select which maintenance is being performed.
* Once the type of maintenance is selected, the user can log the date of maintenance, current mileage, optionally attach photo receipt or notes. Adding the maintenance which will reset the appropriate gauges for the maintenance item on the dashboard.

# Nice to have
* Email notifications when maintenance is needed
* Somehow track mileage of vehicle so you don't need to manually update mileage