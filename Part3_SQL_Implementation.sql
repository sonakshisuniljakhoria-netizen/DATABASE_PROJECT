-- =====================================================================
-- SECTION A : DATABASE / USER CREATION  (run as SYSTEM / DBA)
-- Oracle has no "CREATE DATABASE" per project; a schema (user) is created.
-- For Oracle XE 21c use a pluggable DB session (XEPDB1) and
-- ALTER SESSION SET "_ORACLE_SCRIPT"=true;  before CREATE USER.
-- =====================================================================
CREATE USER drone_relief IDENTIFIED BY drone123;
GRANT CONNECT, RESOURCE, CREATE VIEW TO drone_relief;
ALTER USER drone_relief QUOTA UNLIMITED ON USERS;
CONNECT drone_relief/drone123

-- =====================================================================
-- SECTION B : DDL - TABLE CREATION WITH INTEGRITY CONSTRAINTS
-- (parents are created before children)
-- =====================================================================

-- 1. ORGANIZATION
CREATE TABLE Organization (
    OrganizationID    NUMBER(4)      CONSTRAINT pk_org PRIMARY KEY,
    OrganizationName  VARCHAR2(60)   NOT NULL,
    Type              VARCHAR2(20)   CONSTRAINT ck_org_type
                      CHECK (Type IN ('Government','NGO','Private')),
    HeadOffice        VARCHAR2(60)
);

-- 2. ORGANIZATION_PHONE (multivalued attribute PhoneNo)
CREATE TABLE Organization_Phone (
    OrganizationID    NUMBER(4),
    PhoneNo           VARCHAR2(15),
    CONSTRAINT pk_orgphone PRIMARY KEY (OrganizationID, PhoneNo),
    CONSTRAINT fk_orgphone_org FOREIGN KEY (OrganizationID)
        REFERENCES Organization(OrganizationID) ON DELETE CASCADE
);

-- 3. OPERATOR
CREATE TABLE Operator (
    OperatorID        NUMBER(4)      CONSTRAINT pk_operator PRIMARY KEY,
    FirstName         VARCHAR2(30)   NOT NULL,
    LastName          VARCHAR2(30),
    LicenseNo         VARCHAR2(20)   CONSTRAINT uq_license UNIQUE NOT NULL,
    OrganizationID    NUMBER(4),
    CONSTRAINT fk_operator_org FOREIGN KEY (OrganizationID)
        REFERENCES Organization(OrganizationID)
);

-- 4. VOLUNTEER
CREATE TABLE Volunteer (
    VolunteerID       NUMBER(4)      CONSTRAINT pk_volunteer PRIMARY KEY,
    FirstName         VARCHAR2(30)   NOT NULL,
    LastName          VARCHAR2(30),
    Phone             VARCHAR2(15),
    Skill             VARCHAR2(40),
    OrganizationID    NUMBER(4),
    CONSTRAINT fk_vol_org FOREIGN KEY (OrganizationID)
        REFERENCES Organization(OrganizationID)
);

-- 5. DRONE_MODEL (created while removing the transitive dependency in Drone)
CREATE TABLE Drone_Model (
    Model             VARCHAR2(30)   CONSTRAINT pk_dmodel PRIMARY KEY,
    Manufacturer      VARCHAR2(40)   NOT NULL,
    PayloadCapacity   NUMBER(5,2)    CONSTRAINT ck_payload CHECK (PayloadCapacity > 0),
    MaxFlightTime     NUMBER(4)      CONSTRAINT ck_flight CHECK (MaxFlightTime > 0)
);

-- 6. DRONE
CREATE TABLE Drone (
    DroneID           NUMBER(4)      CONSTRAINT pk_drone PRIMARY KEY,
    Model             VARCHAR2(30)   NOT NULL,
    BatteryLevel      NUMBER(3)      CONSTRAINT ck_battery CHECK (BatteryLevel BETWEEN 0 AND 100),
    Status            VARCHAR2(20)   DEFAULT 'Available'
                      CONSTRAINT ck_drone_status
                      CHECK (Status IN ('Available','On Mission','Under Maintenance')),
    OperatorID        NUMBER(4),
    CONSTRAINT fk_drone_model FOREIGN KEY (Model) REFERENCES Drone_Model(Model),
    CONSTRAINT fk_drone_oper  FOREIGN KEY (OperatorID) REFERENCES Operator(OperatorID)
);

-- 7. MAINTENANCE_RECORD (weak entity: PK = owner key + partial key)
CREATE TABLE Maintenance_Record (
    DroneID           NUMBER(4),
    MaintenanceID     NUMBER(4),
    MaintenanceDate   DATE           NOT NULL,
    Technician        VARCHAR2(40),
    IssueFound        VARCHAR2(100),
    RepairStatus      VARCHAR2(20)   CONSTRAINT ck_repair
                      CHECK (RepairStatus IN ('Pending','In Progress','Completed')),
    CONSTRAINT pk_maint PRIMARY KEY (DroneID, MaintenanceID),
    CONSTRAINT fk_maint_drone FOREIGN KEY (DroneID)
        REFERENCES Drone(DroneID) ON DELETE CASCADE
);

-- 8. LOCATION
CREATE TABLE Location (
    LocationID        NUMBER(4)      CONSTRAINT pk_location PRIMARY KEY,
    AreaName          VARCHAR2(50)   NOT NULL,
    District          VARCHAR2(40),
    State             VARCHAR2(40),
    Latitude          NUMBER(9,6)    CONSTRAINT ck_lat CHECK (Latitude BETWEEN -90 AND 90),
    Longitude         NUMBER(9,6)    CONSTRAINT ck_long CHECK (Longitude BETWEEN -180 AND 180),
    RiskZone          VARCHAR2(10)   CONSTRAINT ck_risk CHECK (RiskZone IN ('Low','Medium','High'))
);

-- 9. DISASTER
CREATE TABLE Disaster (
    DisasterID        NUMBER(4)      CONSTRAINT pk_disaster PRIMARY KEY,
    DisasterName      VARCHAR2(60)   NOT NULL,
    Type              VARCHAR2(30),
    StartDate         DATE           NOT NULL,
    EndDate           DATE,
    SeverityLevel     VARCHAR2(10)   CONSTRAINT ck_sev
                      CHECK (SeverityLevel IN ('Low','Medium','High','Critical')),
    Description       VARCHAR2(200),
    Status            VARCHAR2(10)   DEFAULT 'Active'
                      CONSTRAINT ck_dis_status CHECK (Status IN ('Active','Contained','Closed')),
    LocationID        NUMBER(4)      NOT NULL,
    CONSTRAINT ck_dis_dates CHECK (EndDate IS NULL OR EndDate >= StartDate),
    CONSTRAINT fk_dis_loc FOREIGN KEY (LocationID) REFERENCES Location(LocationID)
);

-- 10. WEATHER_REPORT
CREATE TABLE Weather_Report (
    WeatherID         NUMBER(4)      CONSTRAINT pk_weather PRIMARY KEY,
    Rainfall          NUMBER(6,2)    CONSTRAINT ck_rain CHECK (Rainfall >= 0),
    WindSpeed         NUMBER(5,1)    CONSTRAINT ck_wind CHECK (WindSpeed >= 0),
    LocationID        NUMBER(4)      NOT NULL,
    CONSTRAINT fk_weather_loc FOREIGN KEY (LocationID) REFERENCES Location(LocationID)
);

-- 11. RELIEF_CAMP
CREATE TABLE Relief_Camp (
    CampID            NUMBER(4)      CONSTRAINT pk_camp PRIMARY KEY,
    CampName          VARCHAR2(60)   NOT NULL,
    Capacity          NUMBER(5)      CONSTRAINT ck_capacity CHECK (Capacity > 0),
    ContactNo         VARCHAR2(15)
);

-- 12. VICTIM
CREATE TABLE Victim (
    VictimID          NUMBER(5)      CONSTRAINT pk_victim PRIMARY KEY,
    VictimName        VARCHAR2(50)   NOT NULL,
    DateOfBirth       DATE,
    Gender            CHAR(1)        CONSTRAINT ck_gender CHECK (Gender IN ('M','F','O')),
    MedicalPriority   VARCHAR2(10)   CONSTRAINT ck_medprio
                      CHECK (MedicalPriority IN ('Low','Medium','High','Critical')),
    CurrentStatus     VARCHAR2(15)   DEFAULT 'Missing'
                      CONSTRAINT ck_vstatus
                      CHECK (CurrentStatus IN ('Missing','Rescued','In Camp','Hospitalized','Discharged')),
    DisasterID        NUMBER(4)      NOT NULL,
    CampID            NUMBER(4),
    CONSTRAINT fk_vic_dis  FOREIGN KEY (DisasterID) REFERENCES Disaster(DisasterID),
    CONSTRAINT fk_vic_camp FOREIGN KEY (CampID) REFERENCES Relief_Camp(CampID)
        ON DELETE SET NULL
);

-- 13. SUPPLY
CREATE TABLE Supply (
    SupplyID          NUMBER(4)      CONSTRAINT pk_supply PRIMARY KEY,
    SupplyType        VARCHAR2(40)   NOT NULL,
    QuantityAvailable NUMBER(6)      DEFAULT 0 CONSTRAINT ck_qty CHECK (QuantityAvailable >= 0),
    CampID            NUMBER(4),
    CONSTRAINT fk_supply_camp FOREIGN KEY (CampID) REFERENCES Relief_Camp(CampID)
);

-- 14. MISSION
CREATE TABLE Mission (
    MissionID         NUMBER(5)      CONSTRAINT pk_mission PRIMARY KEY,
    MissionType       VARCHAR2(20)   CONSTRAINT ck_mtype
                      CHECK (MissionType IN ('Rescue','Supply Drop','Surveillance','Medical')),
    MissionDate       DATE           NOT NULL,
    Priority          VARCHAR2(10)   CONSTRAINT ck_mprio
                      CHECK (Priority IN ('Low','Medium','High','Critical')),
    MissionStatus     VARCHAR2(15)   DEFAULT 'Planned'
                      CONSTRAINT ck_mstatus
                      CHECK (MissionStatus IN ('Planned','In Progress','Completed','Aborted')),
    DisasterID        NUMBER(4)      NOT NULL,
    DroneID           NUMBER(4)      NOT NULL,
    OperatorID        NUMBER(4)      NOT NULL,
    CONSTRAINT fk_m_dis  FOREIGN KEY (DisasterID) REFERENCES Disaster(DisasterID),
    CONSTRAINT fk_m_drn  FOREIGN KEY (DroneID)    REFERENCES Drone(DroneID),
    CONSTRAINT fk_m_oper FOREIGN KEY (OperatorID) REFERENCES Operator(OperatorID)
);

-- 15. MISSION_VICTIM (M:N)
CREATE TABLE Mission_Victim (
    MissionID         NUMBER(5),
    VictimID          NUMBER(5),
    Outcome           VARCHAR2(20)   CONSTRAINT ck_outcome
                      CHECK (Outcome IN ('Rescued','Injured','Not Found','Deceased')),
    RescueTime        TIMESTAMP,
    CONSTRAINT pk_mv PRIMARY KEY (MissionID, VictimID),
    CONSTRAINT fk_mv_m FOREIGN KEY (MissionID) REFERENCES Mission(MissionID) ON DELETE CASCADE,
    CONSTRAINT fk_mv_v FOREIGN KEY (VictimID)  REFERENCES Victim(VictimID)  ON DELETE CASCADE
);

-- 16. MISSION_SUPPLY (M:N)
CREATE TABLE Mission_Supply (
    MissionID         NUMBER(5),
    SupplyID          NUMBER(4),
    Quantity          NUMBER(6)      CONSTRAINT ck_qdel CHECK (Quantity > 0),
    CONSTRAINT pk_ms PRIMARY KEY (MissionID, SupplyID),
    CONSTRAINT fk_ms_m FOREIGN KEY (MissionID) REFERENCES Mission(MissionID) ON DELETE CASCADE,
    CONSTRAINT fk_ms_s FOREIGN KEY (SupplyID)  REFERENCES Supply(SupplyID)   ON DELETE CASCADE
);

-- Verify
SELECT table_name FROM user_tables ORDER BY table_name;
DESC Drone;
DESC Mission;

-- =====================================================================
-- SECTION C : DATA POPULATION (DML - INSERT)
-- =====================================================================

-- Organization
INSERT INTO Organization VALUES (1,'National Disaster Response Force','Government','New Delhi');
INSERT INTO Organization VALUES (2,'Indian Red Cross Society','NGO','New Delhi');
INSERT INTO Organization VALUES (3,'Tamil Nadu State Disaster Management Authority','Government','Chennai');
INSERT INTO Organization VALUES (4,'SkyAid Robotics Pvt Ltd','Private','Bengaluru');

INSERT INTO Organization_Phone VALUES (1,'011-24363260');
INSERT INTO Organization_Phone VALUES (1,'011-24363261');
INSERT INTO Organization_Phone VALUES (2,'011-23716441');
INSERT INTO Organization_Phone VALUES (3,'044-28593990');
INSERT INTO Organization_Phone VALUES (4,'080-41234567');

-- Operator
INSERT INTO Operator VALUES (101,'Arjun','Menon','DGCA-OP-1001',1);
INSERT INTO Operator VALUES (102,'Priya','Nair','DGCA-OP-1002',1);
INSERT INTO Operator VALUES (103,'Karthik','Raman','DGCA-OP-1003',3);
INSERT INTO Operator VALUES (104,'Fatima','Sheikh','DGCA-OP-1004',4);

-- Volunteer
INSERT INTO Volunteer VALUES (201,'Rahul','Verma','9840011223','First Aid',2);
INSERT INTO Volunteer VALUES (202,'Divya','Iyer','9841122334','Logistics',2);
INSERT INTO Volunteer VALUES (203,'Imran','Khan','9842233445','Boat Handling',3);
INSERT INTO Volunteer VALUES (204,'Sneha','Pillai','9843344556','Counselling',2);

-- Drone_Model
INSERT INTO Drone_Model VALUES ('Matrice 300','DJI',2.70,55);
INSERT INTO Drone_Model VALUES ('Mavic 3 Enterprise','DJI',0.90,45);
INSERT INTO Drone_Model VALUES ('EVO II Pro','Autel Robotics',0.65,40);
INSERT INTO Drone_Model VALUES ('Heavy Lift X8','SkyAid',15.00,30);

-- Drone
INSERT INTO Drone VALUES (301,'Matrice 300',85,'Available',101);
INSERT INTO Drone VALUES (302,'Mavic 3 Enterprise',60,'On Mission',102);
INSERT INTO Drone VALUES (303,'EVO II Pro',20,'Under Maintenance',103);
INSERT INTO Drone VALUES (304,'Heavy Lift X8',95,'Available',104);
INSERT INTO Drone VALUES (305,'Matrice 300',70,'Available',NULL);   -- unassigned drone

-- Maintenance_Record
INSERT INTO Maintenance_Record VALUES (301,1,DATE '2026-03-10','Ramesh Babu','Propeller wear','Completed');
INSERT INTO Maintenance_Record VALUES (301,2,DATE '2026-07-22','Ramesh Babu','Battery swelling','Completed');
INSERT INTO Maintenance_Record VALUES (303,1,DATE '2026-09-15','Suresh Kumar','Gimbal failure','In Progress');
INSERT INTO Maintenance_Record VALUES (304,1,DATE '2026-08-05','Anita Das','Motor overheating','Completed');

-- Location
INSERT INTO Location VALUES (401,'Velachery','Chennai','Tamil Nadu',12.975800,80.221200,'High');
INSERT INTO Location VALUES (402,'Meppadi','Wayanad','Kerala',11.553000,76.136000,'High');
INSERT INTO Location VALUES (403,'Kuttanad','Alappuzha','Kerala',9.470000,76.400000,'Medium');
INSERT INTO Location VALUES (404,'Puri Coast','Puri','Odisha',19.806500,85.831300,'Medium');

-- Disaster
INSERT INTO Disaster VALUES (501,'Chennai Urban Floods 2026','Flood',DATE '2026-09-01',NULL,'High',
       'Heavy rainfall causing waterlogging in south Chennai','Active',401);
INSERT INTO Disaster VALUES (502,'Wayanad Landslide 2026','Landslide',DATE '2026-07-30',DATE '2026-08-20','Critical',
       'Major landslide after continuous rain','Closed',402);
INSERT INTO Disaster VALUES (503,'Kuttanad Flood 2026','Flood',DATE '2026-08-10',NULL,'Medium',
       'River overflow affecting low-lying villages','Contained',403);
INSERT INTO Disaster VALUES (504,'Cyclone Dana-II','Cyclone',DATE '2026-10-01',NULL,'High',
       'Cyclone landfall near Puri','Active',404);

-- Weather_Report
INSERT INTO Weather_Report VALUES (601,210.50,65.0,401);
INSERT INTO Weather_Report VALUES (602,340.00,40.5,402);
INSERT INTO Weather_Report VALUES (603,150.25,30.0,403);
INSERT INTO Weather_Report VALUES (604,95.00,130.0,404);
INSERT INTO Weather_Report VALUES (605,180.75,55.0,401);

-- Relief_Camp
INSERT INTO Relief_Camp VALUES (701,'Velachery Government School Camp',300,'044-22001122');
INSERT INTO Relief_Camp VALUES (702,'Meppadi Community Hall Camp',150,'04936-220011');
INSERT INTO Relief_Camp VALUES (703,'Alappuzha Town Hall Camp',200,'0477-2251234');

-- Victim
INSERT INTO Victim VALUES (801,'Anil Kumar',DATE '1985-04-12','M','Medium','In Camp',501,701);
INSERT INTO Victim VALUES (802,'Meena Devi',DATE '1992-11-03','F','High','In Camp',501,701);
INSERT INTO Victim VALUES (803,'Ravi Shankar',DATE '1960-06-25','M','Critical','Hospitalized',502,702);
INSERT INTO Victim VALUES (804,'Lakshmi Nair',DATE '2015-02-18','F','Low','In Camp',503,703);
INSERT INTO Victim VALUES (805,'Joseph Mathew',DATE '1978-09-30','M','High','Rescued',503,NULL);
INSERT INTO Victim VALUES (806,'Fatima Begum',DATE '2001-01-15','F','Medium','Missing',501,NULL);

-- Supply
INSERT INTO Supply VALUES (901,'Drinking Water (litres)',5000,701);
INSERT INTO Supply VALUES (902,'Food Packets',3000,701);
INSERT INTO Supply VALUES (903,'First Aid Kits',400,702);
INSERT INTO Supply VALUES (904,'Blankets',1200,703);
INSERT INTO Supply VALUES (905,'Life Jackets',250,703);

-- Mission
INSERT INTO Mission VALUES (1001,'Rescue',DATE '2026-09-02','Critical','Completed',501,301,101);
INSERT INTO Mission VALUES (1002,'Supply Drop',DATE '2026-09-03','High','Completed',501,304,104);
INSERT INTO Mission VALUES (1003,'Rescue',DATE '2026-08-01','Critical','Completed',502,301,102);
INSERT INTO Mission VALUES (1004,'Surveillance',DATE '2026-08-12','Medium','Completed',503,302,102);
INSERT INTO Mission VALUES (1005,'Medical',DATE '2026-10-02','High','In Progress',504,304,104);
INSERT INTO Mission VALUES (1006,'Rescue',DATE '2026-10-05','High','Planned',501,305,103);

-- Mission_Victim
INSERT INTO Mission_Victim VALUES (1001,801,'Rescued',TIMESTAMP '2026-09-02 10:30:00');
INSERT INTO Mission_Victim VALUES (1001,802,'Rescued',TIMESTAMP '2026-09-02 11:05:00');
INSERT INTO Mission_Victim VALUES (1003,803,'Injured',TIMESTAMP '2026-08-01 14:20:00');
INSERT INTO Mission_Victim VALUES (1004,805,'Rescued',TIMESTAMP '2026-08-12 16:45:00');
INSERT INTO Mission_Victim VALUES (1004,804,'Rescued',TIMESTAMP '2026-08-12 17:10:00');

-- Mission_Supply
INSERT INTO Mission_Supply VALUES (1002,901,500);
INSERT INTO Mission_Supply VALUES (1002,902,300);
INSERT INTO Mission_Supply VALUES (1005,903,50);
INSERT INTO Mission_Supply VALUES (1003,905,40);
INSERT INTO Mission_Supply VALUES (1004,904,100);

COMMIT;

-- Check data
SELECT * FROM Organization;
SELECT * FROM Drone;
SELECT * FROM Mission;

-- =====================================================================
-- SECTION D : DDL  (ALTER, TRUNCATE, DROP, RENAME, INDEX, VIEW)
-- =====================================================================

-- ALTER: add a column, modify it, rename it, drop it
ALTER TABLE Victim ADD (Address VARCHAR2(80));
ALTER TABLE Victim MODIFY (Address VARCHAR2(120));
ALTER TABLE Victim RENAME COLUMN Address TO HomeAddress;
ALTER TABLE Victim DROP COLUMN HomeAddress;

-- ALTER: add / drop a constraint
ALTER TABLE Organization ADD CONSTRAINT uq_orgname UNIQUE (OrganizationName);
ALTER TABLE Organization DROP CONSTRAINT uq_orgname;

-- Temporary table to demonstrate TRUNCATE / RENAME / DROP
CREATE TABLE Temp_Log AS SELECT * FROM Weather_Report;
RENAME Temp_Log TO Weather_Backup;
TRUNCATE TABLE Weather_Backup;
DROP TABLE Weather_Backup;

-- Index
CREATE INDEX idx_victim_disaster ON Victim(DisasterID);
CREATE INDEX idx_mission_date    ON Mission(MissionDate);

-- Sequence (for auto-generating IDs)
CREATE SEQUENCE seq_victim START WITH 807 INCREMENT BY 1 NOCACHE;

-- Views : derived attributes (Age, CurrentOccupancy) are computed, not stored
CREATE OR REPLACE VIEW Victim_Age_View AS
SELECT VictimID, VictimName, DateOfBirth,
       TRUNC(MONTHS_BETWEEN(SYSDATE, DateOfBirth)/12) AS Age,
       Gender, MedicalPriority, CurrentStatus
FROM   Victim;

CREATE OR REPLACE VIEW Camp_Occupancy_View AS
SELECT c.CampID, c.CampName, c.Capacity,
       COUNT(v.VictimID) AS CurrentOccupancy,
       c.Capacity - COUNT(v.VictimID) AS VacantSpace
FROM   Relief_Camp c LEFT JOIN Victim v ON c.CampID = v.CampID
GROUP  BY c.CampID, c.CampName, c.Capacity;

SELECT * FROM Victim_Age_View;
SELECT * FROM Camp_Occupancy_View;

-- =====================================================================
-- SECTION E : DML - INSERT / UPDATE / DELETE
-- =====================================================================

-- INSERT using sequence
INSERT INTO Victim VALUES (seq_victim.NEXTVAL,'Suresh Pillai',DATE '1970-05-05','M','High','Missing',504,NULL);

-- UPDATE
UPDATE Drone SET BatteryLevel = 100, Status = 'Available' WHERE DroneID = 303;
UPDATE Victim SET CurrentStatus = 'In Camp', CampID = 703 WHERE VictimID = 805;
UPDATE Supply SET QuantityAvailable = QuantityAvailable - 500 WHERE SupplyID = 901;
UPDATE Mission SET MissionStatus = 'Completed' WHERE MissionID = 1005;

-- DELETE
DELETE FROM Weather_Report WHERE WeatherID = 605;
DELETE FROM Volunteer WHERE VolunteerID = 204;

-- Integrity-constraint demonstration (each statement below should FAIL)
INSERT INTO Drone VALUES (306,'Matrice 300',150,'Available',101);       -- CHECK violated (battery > 100)
INSERT INTO Drone VALUES (301,'Matrice 300',50,'Available',101);        -- PK violated (duplicate)
INSERT INTO Operator VALUES (105,'Test','User','DGCA-OP-1001',1);       -- UNIQUE violated
INSERT INTO Mission VALUES (1007,'Rescue',DATE '2026-10-06','High','Planned',999,301,101); -- FK violated
DELETE FROM Organization WHERE OrganizationID = 1;                      -- FK child records exist

-- ON DELETE behaviour
DELETE FROM Relief_Camp WHERE CampID = 702;     -- Victim.CampID becomes NULL (SET NULL)
SELECT VictimID, VictimName, CampID FROM Victim WHERE VictimID = 803;
ROLLBACK;

-- =====================================================================
-- SECTION F : TCL - COMMIT, SAVEPOINT, ROLLBACK
-- =====================================================================
INSERT INTO Supply VALUES (906,'Tents',100,701);
COMMIT;                                   -- 906 made permanent

SAVEPOINT sp1;
UPDATE Supply SET QuantityAvailable = 0 WHERE SupplyID = 906;
SAVEPOINT sp2;
DELETE FROM Supply WHERE SupplyID = 905 ;
ROLLBACK TO sp2;                          -- undo the DELETE only
SELECT * FROM Supply;
ROLLBACK TO sp1;                          -- undo the UPDATE as well
SELECT * FROM Supply WHERE SupplyID = 906;
COMMIT;

-- DCL (optional)
-- GRANT SELECT ON Victim TO PUBLIC;
-- REVOKE SELECT ON Victim FROM PUBLIC;

-- =====================================================================
-- SECTION G : SQL QUERIES (Lab Cycle Sheets I - VI style)
-- =====================================================================

-- ---------- Cycle I/II : Basic SELECT, WHERE, operators, sorting ----------
-- Q1. All drones that are available
SELECT DroneID, Model, BatteryLevel FROM Drone WHERE Status = 'Available';

-- Q2. Disasters of High or Critical severity, latest first
SELECT DisasterName, Type, SeverityLevel, StartDate
FROM   Disaster
WHERE  SeverityLevel IN ('High','Critical')
ORDER  BY StartDate DESC;

-- Q3. Drones with battery between 50 and 90
SELECT DroneID, BatteryLevel FROM Drone WHERE BatteryLevel BETWEEN 50 AND 90;

-- Q4. Victims whose name starts with 'M' or contains 'an'
SELECT VictimName FROM Victim WHERE VictimName LIKE 'M%' OR VictimName LIKE '%an%';

-- Q5. Drones not assigned to any operator
SELECT DroneID, Model FROM Drone WHERE OperatorID IS NULL;

-- Q6. Distinct mission types
SELECT DISTINCT MissionType FROM Mission;

-- ---------- Cycle III : Single-row & group functions, GROUP BY, HAVING ----------
-- Q7. Count of missions of each type
SELECT MissionType, COUNT(*) AS Total_Missions
FROM   Mission GROUP BY MissionType;

-- Q8. Average battery level, max and min payload
SELECT ROUND(AVG(BatteryLevel),2) AS Avg_Battery FROM Drone;
SELECT MAX(PayloadCapacity) AS Max_Payload, MIN(PayloadCapacity) AS Min_Payload FROM Drone_Model;

-- Q9. Disasters that have more than one mission
SELECT DisasterID, COUNT(*) AS Mission_Count
FROM   Mission GROUP BY DisasterID HAVING COUNT(*) > 1;

-- Q10. Age of each victim (date and string functions)
SELECT VictimName,
       TRUNC(MONTHS_BETWEEN(SYSDATE, DateOfBirth)/12) AS Age,
       UPPER(VictimName) AS Name_Upper,
       LENGTH(VictimName) AS Name_Length
FROM   Victim;

-- Q11. Duration of each disaster in days (NVL for ongoing disasters)
SELECT DisasterName, StartDate, NVL(EndDate, SYSDATE) - StartDate AS Duration_Days
FROM   Disaster;

-- Q12. Total quantity of each supply delivered through missions
SELECT s.SupplyType, SUM(ms.Quantity) AS Total_Delivered
FROM   Supply s JOIN Mission_Supply ms ON s.SupplyID = ms.SupplyID
GROUP  BY s.SupplyType;

-- ---------- Cycle IV : Joins ----------
-- Q13. Operator name with organization name (INNER JOIN)
SELECT o.FirstName || ' ' || o.LastName AS Operator, g.OrganizationName
FROM   Operator o JOIN Organization g ON o.OrganizationID = g.OrganizationID;

-- Q14. Mission details with disaster, drone model and operator (multi-table join)
SELECT m.MissionID, m.MissionType, d.DisasterName, dr.Model,
       o.FirstName AS Operator, m.MissionStatus
FROM   Mission m
JOIN   Disaster d  ON m.DisasterID = d.DisasterID
JOIN   Drone dr    ON m.DroneID    = dr.DroneID
JOIN   Operator o  ON m.OperatorID = o.OperatorID;

-- Q15. All drones with maintenance records (LEFT OUTER JOIN - includes drones never serviced)
SELECT d.DroneID, d.Model, mr.MaintenanceDate, mr.IssueFound
FROM   Drone d LEFT JOIN Maintenance_Record mr ON d.DroneID = mr.DroneID;

-- Q16. Victims rescued in each mission
SELECT m.MissionID, v.VictimName, mv.Outcome, mv.RescueTime
FROM   Mission_Victim mv
JOIN   Mission m ON mv.MissionID = m.MissionID
JOIN   Victim  v ON mv.VictimID  = v.VictimID
ORDER  BY m.MissionID;

-- Q17. Camps with their victims (RIGHT / FULL join variant)
SELECT c.CampName, v.VictimName
FROM   Relief_Camp c FULL OUTER JOIN Victim v ON c.CampID = v.CampID;

-- Q18. Self join: pairs of drones of the same model
SELECT a.DroneID AS Drone1, b.DroneID AS Drone2, a.Model
FROM   Drone a JOIN Drone b ON a.Model = b.Model AND a.DroneID < b.DroneID;

-- ---------- Cycle V : Subqueries and set operations ----------
-- Q19. Drones whose battery is above the average
SELECT DroneID, BatteryLevel FROM Drone
WHERE  BatteryLevel > (SELECT AVG(BatteryLevel) FROM Drone);

-- Q20. Operators who have executed at least one mission (IN / EXISTS)
SELECT FirstName, LastName FROM Operator
WHERE  OperatorID IN (SELECT OperatorID FROM Mission);

SELECT FirstName FROM Operator o
WHERE  EXISTS (SELECT 1 FROM Mission m WHERE m.OperatorID = o.OperatorID);

-- Q21. Drones that have never been used in any mission (NOT IN)
SELECT DroneID, Model FROM Drone
WHERE  DroneID NOT IN (SELECT DroneID FROM Mission);

-- Q22. Disaster with the highest number of victims
SELECT DisasterID, COUNT(*) AS Victims FROM Victim
GROUP  BY DisasterID
HAVING COUNT(*) = (SELECT MAX(COUNT(*)) FROM Victim GROUP BY DisasterID);

-- Q23. Victims not yet allocated to any camp
SELECT VictimName, CurrentStatus FROM Victim WHERE CampID IS NULL;

-- Q24. Set operations
SELECT DisasterID FROM Mission
UNION
SELECT DisasterID FROM Victim;

SELECT DisasterID FROM Victim
INTERSECT
SELECT DisasterID FROM Mission;

SELECT DisasterID FROM Disaster
MINUS
SELECT DisasterID FROM Mission;

-- Q25. Camps that are at more than 1 victim (using the view)
SELECT * FROM Camp_Occupancy_View WHERE CurrentOccupancy >= 1;

-- ---------- Cycle VI : PL/SQL (procedure, function, cursor, trigger) ----------
SET SERVEROUTPUT ON;

-- Q26. Function: age of a victim
CREATE OR REPLACE FUNCTION get_victim_age (p_id NUMBER) RETURN NUMBER IS
    v_age NUMBER;
BEGIN
    SELECT TRUNC(MONTHS_BETWEEN(SYSDATE, DateOfBirth)/12) INTO v_age
    FROM   Victim WHERE VictimID = p_id;
    RETURN v_age;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN NULL;
END;
/
SELECT VictimName, get_victim_age(VictimID) AS Age FROM Victim;

-- Q27. Procedure: allocate a victim to a camp only if space is available
CREATE OR REPLACE PROCEDURE allocate_camp (p_victim NUMBER, p_camp NUMBER) IS
    v_cap  NUMBER;
    v_occ  NUMBER;
BEGIN
    SELECT Capacity INTO v_cap FROM Relief_Camp WHERE CampID = p_camp;
    SELECT COUNT(*) INTO v_occ FROM Victim WHERE CampID = p_camp;
    IF v_occ < v_cap THEN
        UPDATE Victim SET CampID = p_camp, CurrentStatus = 'In Camp'
        WHERE  VictimID = p_victim;
        DBMS_OUTPUT.PUT_LINE('Victim ' || p_victim || ' allocated to camp ' || p_camp);
    ELSE
        DBMS_OUTPUT.PUT_LINE('Camp ' || p_camp || ' is full');
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN DBMS_OUTPUT.PUT_LINE('Invalid camp ID');
END;
/
EXEC allocate_camp(806, 701);

-- Q28. Cursor: list all active disasters with mission count
DECLARE
    CURSOR c_dis IS
        SELECT d.DisasterName, COUNT(m.MissionID) AS cnt
        FROM   Disaster d LEFT JOIN Mission m ON d.DisasterID = m.DisasterID
        WHERE  d.Status = 'Active'
        GROUP  BY d.DisasterName;
BEGIN
    FOR r IN c_dis LOOP
        DBMS_OUTPUT.PUT_LINE(r.DisasterName || ' -> ' || r.cnt || ' mission(s)');
    END LOOP;
END;
/

-- Q29. Trigger: when a mission is created, mark the drone 'On Mission' (only for In Progress)
CREATE OR REPLACE TRIGGER trg_drone_on_mission
AFTER INSERT OR UPDATE OF MissionStatus ON Mission
FOR EACH ROW
BEGIN
    IF :NEW.MissionStatus = 'In Progress' THEN
        UPDATE Drone SET Status = 'On Mission' WHERE DroneID = :NEW.DroneID;
    ELSIF :NEW.MissionStatus IN ('Completed','Aborted') THEN
        UPDATE Drone SET Status = 'Available' WHERE DroneID = :NEW.DroneID;
    END IF;
END;
/
UPDATE Mission SET MissionStatus = 'In Progress' WHERE MissionID = 1006;
SELECT DroneID, Status FROM Drone WHERE DroneID = 305;
ROLLBACK;

-- Q30. Trigger: prevent a drone with battery < 30% from being assigned to a mission
CREATE OR REPLACE TRIGGER trg_low_battery
BEFORE INSERT ON Mission
FOR EACH ROW
DECLARE
    v_bat NUMBER;
BEGIN
    SELECT BatteryLevel INTO v_bat FROM Drone WHERE DroneID = :NEW.DroneID;
    IF v_bat < 30 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Drone battery too low for mission');
    END IF;
END;
/
-- Test (drone 303 has 100 after update above; set low first)
UPDATE Drone SET BatteryLevel = 20 WHERE DroneID = 303;
INSERT INTO Mission VALUES (1007,'Rescue',SYSDATE,'High','Planned',501,303,103);  -- should fail
ROLLBACK;

-- =====================================================================
-- END OF SCRIPT
-- =====================================================================
